import ast
import re
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
from app.utils.logger import logger


@dataclass
class ParamInfo:
    name: str
    type_hint: Optional[str] = None
    default: Optional[str] = None


@dataclass
class FunctionInfo:
    name: str
    params: List[ParamInfo]
    return_type: Optional[str]
    docstring: Optional[str]
    decorators: List[str]
    line_number: int
    source: str


@dataclass
class ClassInfo:
    name: str
    base_classes: List[str]
    methods: List[FunctionInfo]
    attributes: List[str]
    docstring: Optional[str]
    line_number: int


@dataclass
class CodeStructure:
    language: str
    file_path: str
    functions: List[FunctionInfo] = field(default_factory=list)
    classes: List[ClassInfo] = field(default_factory=list)
    imports: List[str] = field(default_factory=list)
    api_endpoints: List[Dict] = field(default_factory=list)
    raw_content: str = ""


class CodeAnalyzer:

    def analyze(self, file_path: str, content: str, language: str) -> CodeStructure:
        structure = CodeStructure(
            language=language,
            file_path=file_path,
            raw_content=content,
        )
        try:
            if language == "python":
                self._analyze_python(content, structure)
            elif language in ("javascript", "typescript"):
                self._analyze_js_ts(content, structure)
            elif language == "java":
                self._analyze_java(content, structure)
            elif language == "go":
                self._analyze_go(content, structure)
            else:
                self._analyze_generic(content, structure)
        except Exception as exc:
            logger.warning("Analysis failed for %s: %s", file_path, exc)
        return structure

    # ------------------------------------------------------------------ #
    #  Python                                                              #
    # ------------------------------------------------------------------ #

    def _analyze_python(self, content: str, structure: CodeStructure) -> None:
        try:
            tree = ast.parse(content)
        except SyntaxError as exc:
            logger.warning("Python syntax error: %s", exc)
            return

        lines = content.splitlines()

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    structure.imports.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ""
                names = ", ".join(a.name for a in node.names)
                structure.imports.append(f"{module}.{names}")

        for node in ast.iter_child_nodes(tree):
            if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef):
                structure.functions.append(self._extract_py_function(node, lines))
            elif isinstance(node, ast.ClassDef):
                structure.classes.append(self._extract_py_class(node, lines))

        # Detect FastAPI/Flask routes
        structure.api_endpoints = self._detect_py_routes(tree, content)

    def _extract_py_function(self, node: ast.FunctionDef, lines: list) -> FunctionInfo:
        params = []
        for arg in node.args.args:
            if arg.arg == "self":
                continue
            hint = None
            if arg.annotation:
                try:
                    hint = ast.unparse(arg.annotation)
                except Exception:
                    pass
            params.append(ParamInfo(name=arg.arg, type_hint=hint))

        return_type = None
        if node.returns:
            try:
                return_type = ast.unparse(node.returns)
            except Exception:
                pass

        docstring = ast.get_docstring(node)
        decorators = []
        for d in node.decorator_list:
            try:
                decorators.append(ast.unparse(d))
            except Exception:
                pass

        end_line = getattr(node, "end_lineno", node.lineno + 10)
        source_lines = lines[node.lineno - 1: min(end_line, node.lineno + 50)]
        source = "\n".join(source_lines)

        return FunctionInfo(
            name=node.name,
            params=params,
            return_type=return_type,
            docstring=docstring,
            decorators=decorators,
            line_number=node.lineno,
            source=source,
        )

    def _extract_py_class(self, node: ast.ClassDef, lines: list) -> ClassInfo:
        base_classes = []
        for base in node.bases:
            try:
                base_classes.append(ast.unparse(base))
            except Exception:
                pass

        methods = []
        attributes = []
        for child in ast.iter_child_nodes(node):
            if isinstance(child, ast.FunctionDef | ast.AsyncFunctionDef):
                methods.append(self._extract_py_function(child, lines))
            elif isinstance(child, ast.Assign):
                for target in child.targets:
                    if isinstance(target, ast.Name):
                        attributes.append(target.id)
            elif isinstance(child, ast.AnnAssign):
                if isinstance(child.target, ast.Name):
                    try:
                        attr = f"{child.target.id}: {ast.unparse(child.annotation)}"
                    except Exception:
                        attr = child.target.id
                    attributes.append(attr)

        return ClassInfo(
            name=node.name,
            base_classes=base_classes,
            methods=methods,
            attributes=list(dict.fromkeys(attributes)),
            docstring=ast.get_docstring(node),
            line_number=node.lineno,
        )

    def _detect_py_routes(self, tree: ast.AST, content: str) -> List[Dict]:
        endpoints = []
        fastapi_pattern = re.compile(
            r'@\w+\.(get|post|put|patch|delete|options|head)\s*\(\s*["\']([^"\']+)["\']',
            re.IGNORECASE,
        )
        flask_pattern = re.compile(
            r'@\w+\.route\s*\(\s*["\']([^"\']+)["\'](?:.*?methods\s*=\s*\[([^\]]+)\])?',
            re.IGNORECASE,
        )

        for match in fastapi_pattern.finditer(content):
            endpoints.append({
                "method": match.group(1).upper(),
                "path": match.group(2),
                "framework": "fastapi",
            })
        for match in flask_pattern.finditer(content):
            methods = match.group(2) or "GET"
            methods = [m.strip().strip("'\"") for m in methods.split(",")]
            for method in methods:
                endpoints.append({
                    "method": method.upper(),
                    "path": match.group(1),
                    "framework": "flask",
                })
        return endpoints

    # ------------------------------------------------------------------ #
    #  JavaScript / TypeScript                                             #
    # ------------------------------------------------------------------ #

    def _analyze_js_ts(self, content: str, structure: CodeStructure) -> None:
        # Imports
        import_re = re.compile(r'import\s+.+?\s+from\s+["\']([^"\']+)["\']', re.MULTILINE)
        for m in import_re.finditer(content):
            structure.imports.append(m.group(1))

        # Functions (arrow + regular)
        fn_re = re.compile(
            r'(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)',
            re.MULTILINE,
        )
        arrow_re = re.compile(
            r'(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>',
            re.MULTILINE,
        )
        for pattern in (fn_re, arrow_re):
            for m in pattern.finditer(content):
                params = [ParamInfo(name=p.strip().split(":")[0].strip())
                          for p in m.group(2).split(",") if p.strip()]
                line_no = content[:m.start()].count("\n") + 1
                structure.functions.append(FunctionInfo(
                    name=m.group(1),
                    params=params,
                    return_type=None,
                    docstring=self._extract_jsdoc(content, m.start()),
                    decorators=[],
                    line_number=line_no,
                    source=content[m.start():m.start() + 300],
                ))

        # Classes
        class_re = re.compile(r'(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?', re.MULTILINE)
        for m in class_re.finditer(content):
            line_no = content[:m.start()].count("\n") + 1
            structure.classes.append(ClassInfo(
                name=m.group(1),
                base_classes=[m.group(2)] if m.group(2) else [],
                methods=[],
                attributes=[],
                docstring=self._extract_jsdoc(content, m.start()),
                line_number=line_no,
            ))

        # API routes (Express / Next.js)
        express_re = re.compile(
            r'(?:router|app)\.(get|post|put|patch|delete)\s*\(\s*["\']([^"\']+)["\']',
            re.IGNORECASE,
        )
        for m in express_re.finditer(content):
            structure.api_endpoints.append({
                "method": m.group(1).upper(),
                "path": m.group(2),
                "framework": "express",
            })

    def _extract_jsdoc(self, content: str, pos: int) -> Optional[str]:
        before = content[:pos].rstrip()
        if not before.endswith("*/"):
            return None
        start = before.rfind("/**")
        if start == -1:
            return None
        raw = before[start + 3:-2]
        lines = [re.sub(r"^\s*\*\s?", "", line) for line in raw.splitlines()]
        return "\n".join(lines).strip() or None

    # ------------------------------------------------------------------ #
    #  Java                                                                #
    # ------------------------------------------------------------------ #

    def _analyze_java(self, content: str, structure: CodeStructure) -> None:
        import_re = re.compile(r'import\s+([\w.]+);')
        for m in import_re.finditer(content):
            structure.imports.append(m.group(1))

        class_re = re.compile(
            r'(?:public|private|protected)?\s*(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?',
        )
        for m in class_re.finditer(content):
            implements = [i.strip() for i in (m.group(3) or "").split(",") if i.strip()]
            base = [m.group(2)] if m.group(2) else []
            line_no = content[:m.start()].count("\n") + 1
            structure.classes.append(ClassInfo(
                name=m.group(1),
                base_classes=base + implements,
                methods=[],
                attributes=[],
                docstring=None,
                line_number=line_no,
            ))

        method_re = re.compile(
            r'(?:public|private|protected)\s+(?:static\s+)?(?:final\s+)?([\w<>\[\]]+)\s+(\w+)\s*\(([^)]*)\)',
        )
        for m in method_re.finditer(content):
            params = [ParamInfo(name=p.strip().split()[-1]) for p in m.group(3).split(",") if p.strip()]
            line_no = content[:m.start()].count("\n") + 1
            structure.functions.append(FunctionInfo(
                name=m.group(2),
                params=params,
                return_type=m.group(1),
                docstring=None,
                decorators=[],
                line_number=line_no,
                source="",
            ))

    # ------------------------------------------------------------------ #
    #  Go                                                                  #
    # ------------------------------------------------------------------ #

    def _analyze_go(self, content: str, structure: CodeStructure) -> None:
        import_re = re.compile(r'"([\w./]+)"')
        in_import = False
        for line in content.splitlines():
            stripped = line.strip()
            if stripped.startswith("import ("):
                in_import = True
            elif in_import and stripped == ")":
                in_import = False
            elif in_import or stripped.startswith("import "):
                for m in import_re.finditer(stripped):
                    structure.imports.append(m.group(1))

        func_re = re.compile(r'func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\(([^)]*)\)')
        for m in func_re.finditer(content):
            params = [ParamInfo(name=p.strip().split()[0]) for p in m.group(2).split(",") if p.strip()]
            line_no = content[:m.start()].count("\n") + 1
            structure.functions.append(FunctionInfo(
                name=m.group(1),
                params=params,
                return_type=None,
                docstring=None,
                decorators=[],
                line_number=line_no,
                source="",
            ))

        struct_re = re.compile(r'type\s+(\w+)\s+struct')
        for m in struct_re.finditer(content):
            line_no = content[:m.start()].count("\n") + 1
            structure.classes.append(ClassInfo(
                name=m.group(1),
                base_classes=[],
                methods=[],
                attributes=[],
                docstring=None,
                line_number=line_no,
            ))

    # ------------------------------------------------------------------ #
    #  Generic fallback                                                    #
    # ------------------------------------------------------------------ #

    def _analyze_generic(self, content: str, structure: CodeStructure) -> None:
        fn_re = re.compile(r'\bfunction\s+(\w+)\s*\(', re.IGNORECASE)
        for m in fn_re.finditer(content):
            line_no = content[:m.start()].count("\n") + 1
            structure.functions.append(FunctionInfo(
                name=m.group(1),
                params=[],
                return_type=None,
                docstring=None,
                decorators=[],
                line_number=line_no,
                source="",
            ))

    # ------------------------------------------------------------------ #
    #  Summarization helpers                                               #
    # ------------------------------------------------------------------ #

    def build_summary_text(self, structures: List[CodeStructure]) -> str:
        lines = []
        for s in structures:
            lines.append(f"\n## File: {s.file_path} ({s.language})")
            if s.classes:
                lines.append(f"### Classes ({len(s.classes)})")
                for cls in s.classes:
                    bases = f"({', '.join(cls.base_classes)})" if cls.base_classes else ""
                    lines.append(f"- **{cls.name}** {bases}")
                    if cls.docstring:
                        lines.append(f"  {cls.docstring[:120]}")
                    for m in cls.methods[:5]:
                        params = ", ".join(p.name for p in m.params)
                        lines.append(f"  - `{m.name}({params})`")
            if s.functions:
                lines.append(f"### Functions ({len(s.functions)})")
                for fn in s.functions[:10]:
                    params = ", ".join(p.name for p in fn.params)
                    ret = f" -> {fn.return_type}" if fn.return_type else ""
                    lines.append(f"- `{fn.name}({params}){ret}`")
                    if fn.docstring:
                        lines.append(f"  {fn.docstring[:100]}")
            if s.api_endpoints:
                lines.append(f"### API Endpoints ({len(s.api_endpoints)})")
                for ep in s.api_endpoints:
                    lines.append(f"- `{ep['method']} {ep['path']}`")
        return "\n".join(lines)

    def build_classes_text(self, structures: List[CodeStructure]) -> str:
        lines = []
        for s in structures:
            for cls in s.classes:
                lines.append(f"### Class: {cls.name} (file: {s.file_path})")
                if cls.base_classes:
                    lines.append(f"Extends/Implements: {', '.join(cls.base_classes)}")
                if cls.docstring:
                    lines.append(f"Description: {cls.docstring}")
                if cls.attributes:
                    lines.append("Attributes:")
                    for attr in cls.attributes:
                        lines.append(f"  - {attr}")
                if cls.methods:
                    lines.append("Methods:")
                    for m in cls.methods:
                        params = ", ".join(
                            f"{p.name}: {p.type_hint}" if p.type_hint else p.name
                            for p in m.params
                        )
                        ret = f" -> {m.return_type}" if m.return_type else ""
                        lines.append(f"  - {m.name}({params}){ret}")
                        if m.docstring:
                            lines.append(f"    {m.docstring[:150]}")
                lines.append("")
        return "\n".join(lines)

    def build_functions_text(self, structures: List[CodeStructure]) -> str:
        lines = []
        for s in structures:
            for fn in s.functions:
                lines.append(f"### Function: {fn.name} (file: {s.file_path}, line: {fn.line_number})")
                if fn.decorators:
                    lines.append(f"Decorators: {', '.join(fn.decorators)}")
                params_desc = ", ".join(
                    f"{p.name}: {p.type_hint}" if p.type_hint else p.name for p in fn.params
                )
                lines.append(f"Signature: {fn.name}({params_desc})")
                if fn.return_type:
                    lines.append(f"Returns: {fn.return_type}")
                if fn.docstring:
                    lines.append(f"Existing docstring: {fn.docstring}")
                if fn.source:
                    lines.append(f"Source:\n```\n{fn.source[:500]}\n```")
                lines.append("")
        return "\n".join(lines)

    def build_endpoints_text(self, structures: List[CodeStructure]) -> str:
        lines = []
        for s in structures:
            for ep in s.api_endpoints:
                lines.append(f"- {ep['method']} {ep['path']} (framework: {ep.get('framework', 'unknown')}, file: {s.file_path})")
        return "\n".join(lines)


code_analyzer = CodeAnalyzer()

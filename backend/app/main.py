from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import init_db
from app.routers import upload, documentation, export
from app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s", settings.APP_NAME)
    init_db()
    logger.info("Database initialized")
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.API_VERSION,
    description="Automated technical documentation generator powered by local LLMs via Ollama.",
    lifespan=lifespan,
    docs_url=f"/api/{settings.API_VERSION}/docs",
    redoc_url=f"/api/{settings.API_VERSION}/redoc",
    openapi_url=f"/api/{settings.API_VERSION}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


API_PREFIX = f"/api/{settings.API_VERSION}"
app.include_router(upload.router, prefix=API_PREFIX)
app.include_router(documentation.router, prefix=API_PREFIX)
app.include_router(export.router, prefix=API_PREFIX)


@app.get(f"{API_PREFIX}/health")
async def health():
    from app.services.ollama_service import ollama_service
    ollama_ok = await ollama_service.check_health()
    models = await ollama_service.list_models() if ollama_ok else []
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "ollama": {"connected": ollama_ok, "models": models},
    }


@app.get("/")
def root():
    return {"message": f"{settings.APP_NAME} API is running", "docs": f"/api/{settings.API_VERSION}/docs"}

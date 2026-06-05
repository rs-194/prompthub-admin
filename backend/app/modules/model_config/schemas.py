from pydantic import BaseModel


class ModelConfigStatus(BaseModel):
    provider: str
    model: str
    baseUrlHost: str
    enabled: bool
    apiKeyConfigured: bool
    temperature: float
    maxTokens: int
    timeoutSeconds: float

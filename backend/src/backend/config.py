from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Whitechain
    wc_rpc_url: str = "https://rpc.testnet.whitechain.io"
    wc_chain_id: int = 1874

    # Relayer
    relayer_private_key: str = ""

    # Encryption key (32-byte hex)
    wallet_encryption_key: str = "0" * 64  # dev fallback — override in .env

    # Contract addresses
    pwsr_token_address: str = "0x0000000000000000000000000000000000000000"
    biometric_registry_address: str = "0x0000000000000000000000000000000000000000"
    payment_processor_address: str = "0x0000000000000000000000000000000000000000"

    # Database
    database_url: str = "sqlite:///./facepay.db"

    # Face matching
    face_match_threshold: float = 0.35

    # Gas buffer topped up per new wallet (in WBT, human units)
    gas_buffer_wbt: float = 0.01

    # CORS
    cors_origin: str = "http://localhost:3000"


settings = Settings()

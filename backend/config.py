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

    # USDT checkout (main bounty flow)
    usdt_address: str = "0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7"
    usdt_permit_name: str = "Tether USD"
    usdt_permit_version: str = "1"
    payment_hub_address: str = "0x8E95c4D0915D5d90D5633b4a245470b462147657"

    # Database
    database_url: str = "sqlite:///./facepay.db"

    # Face matching — cosine distance cutoff (ArcFace: <~1.0 is same person)
    face_match_threshold: float = 1.0

    # Gas buffer topped up per new wallet (in WBT, human units)
    gas_buffer_wbt: float = 0.01

    # CORS
    cors_origin: str = "http://localhost:3000"


settings = Settings()

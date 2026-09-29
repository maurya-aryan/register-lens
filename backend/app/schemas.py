from typing import List, Optional
from pydantic import BaseModel, Field


class CellConf(BaseModel):
    drug: float = Field(description="0-1 confidence in the drug name reading")
    batch: float = Field(description="0-1 confidence in the batch number reading")
    expiry: float = Field(description="0-1 confidence in the expiry date reading")
    qty: float = Field(description="0-1 confidence in the numeric quantity readings")


class RegisterRow(BaseModel):
    drug_name_raw: str = Field(description="Drug name exactly as written (keep Hindi or English)")
    strength_raw: Optional[str] = Field(default=None, description="Strength if written, e.g. 500 mg")
    batch: Optional[str] = Field(default=None, description="Batch number as written, or null")
    expiry: Optional[str] = Field(default=None, description="Expiry as YYYY-MM, or null if not readable")
    opening: Optional[int] = Field(default=None, description="Opening balance")
    received: Optional[int] = Field(default=None, description="Quantity received today")
    issued: Optional[int] = Field(default=None, description="Quantity issued/dispensed today")
    closing: Optional[int] = Field(default=None, description="Closing balance")
    confidence: CellConf
    note: Optional[str] = Field(default=None, description="Short note if something is unclear, e.g. crossed out")


class RegisterPage(BaseModel):
    page_date: Optional[str] = Field(default=None, description="Date written on the page as YYYY-MM-DD, or null")
    facility_written: Optional[str] = Field(default=None, description="Facility name written on the page, or null")
    rows: List[RegisterRow]

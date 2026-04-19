from pydantic import BaseModel, Field
from datetime import date
from typing import List, Optional
from enum import Enum

class ExpenseCategory(str, Enum):
    CLEANING = "Cleaning"
    WIFI = "WiFi"
    ELECTRICITY = "Electricity"
    MAINTENANCE = "Maintenance"
    SUPPLIES = "Supplies"

# --- Modèles Financiers ---
class FinancialRecord(BaseModel):
    property_id: int
    amount: float
    date: date
    description: Optional[str] = None

class Revenue(FinancialRecord):
    source: str  # ex: Airbnb, Booking

class Expense(FinancialRecord):
    category: ExpenseCategory
    has_receipt: bool = False

# --- Logique de Calcul (Tâche : Financial Calculation Logic) ---
class PropertyFinancialSummary(BaseModel):
    property_name: str
    total_revenue: float
    total_expenses: float
    commission_rate: float  # ex: 0.20 pour 20%
    
    @property
    def agency_commission(self) -> float:
        return self.total_revenue * self.commission_rate

    @property
    def net_profit(self) -> float:
        # Formule du cahier des charges : Revenue - Expenses - Commission
        return self.total_revenue - self.total_expenses - self.agency_commission

    @property
    def owner_payout(self) -> float:
        return self.net_profit
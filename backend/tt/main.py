from fastapi import FastAPI, UploadFile, File, HTTPException
from typing import List
from models import Revenue, Expense, PropertyFinancialSummary
from services import FinancialService

app = FastAPI(title="Makani SaaS API")

# --- Endpoints Financials ---
@app.post("/financials/revenue")
async def add_revenue(revenue: Revenue):
    # Logique de sauvegarde en DB ici
    return {"message": "Revenue added", "data": revenue}

@app.post("/financials/expense")
async def add_expense(expense: Expense):
    return {"message": "Expense added", "data": expense}

# --- Endpoint Import CSV ---
@app.post("/financials/import-csv")
async def import_financial_data(file: UploadFile = File(...)):
    content = await file.read()
    try:
        result = FinancialService.process_csv_import(content.decode('utf-8'))
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Endpoint Reports (Aggregation & Summary) ---
@app.get("/reports/summary/{property_id}")
async def get_monthly_summary(property_id: int, month: int, year: int):
    # Ici, on simulerait une requête DB pour récupérer les data du mois
    # Pour l'exemple, on utilise des valeurs fictives
    summary = FinancialService.aggregate_monthly_summary(
        revenues=[], # Résultat Query DB
        expenses=[], # Résultat Query DB
        commission_rate=0.20
    )
    return summary

# --- Endpoint Export PDF ---
@app.get("/reports/export-pdf/{report_id}")
async def export_report_pdf(report_id: int):
    # Données simulées pour le rapport
    data = {
        "month": "Août", "year": 2026, 
        "property_name": "Villa Marbella",
        "total_revenue": 42300, "total_expenses": 2315,
        "commission": 8460, "payout": 31525
    }
    pdf = FinancialService.generate_monthly_report_html(data)
    
    from fastapi.responses import Response
    return Response(content=pdf, media_type="application/pdf", 
                    headers={"Content-Disposition": f"attachment; filename=report_{report_id}.pdf"})
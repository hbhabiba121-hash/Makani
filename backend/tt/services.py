import pandas as pd
from io import StringIO
from weasyprint import HTML
from datetime import datetime

class FinancialService:
    @staticmethod
    def process_csv_import(file_content: str):
        """Tâche : CSV import — parse, validate & bulk create"""
        df = pd.read_csv(StringIO(file_content))
        # Validation simple
        required_columns = ['property_id', 'amount', 'type', 'date']
        if not all(col in df.columns for col in required_columns):
            raise ValueError("Colonnes manquantes dans le CSV")
        
        # Logique de création massive (Simulée ici)
        records = df.to_dict(orient='records')
        return {"status": "success", "imported_count": len(records)}

    @staticmethod
    def generate_monthly_report_html(data: dict):
        """Prépare le HTML pour le PDF (Tâche : PDF export)"""
        html_content = f"""
        <h1>Rapport Financier - {data['month']} {data['year']}</h1>
        <p>Propriété : {data['property_name']}</p>
        <hr>
        <ul>
            <li>Revenus Totaux : {data['total_revenue']} MAD</li>
            <li>Dépenses Totales : {data['total_expenses']} MAD</li>
            <li>Commission Agence : {data['commission']} MAD</li>
            <li><b>Paiement Propriétaire : {data['payout']} MAD</b></li>
        </ul>
        """
        return HTML(string=html_content).write_pdf()

    @staticmethod
    def aggregate_monthly_summary(revenues: List[Revenue], expenses: List[Expense], commission_rate: float):
        """Tâche : Reports app — monthly summary aggregation"""
        total_rev = sum(r.amount for r in revenues)
        total_exp = sum(e.amount for e in expenses)
        
        agency_comm = total_rev * commission_rate
        net = total_rev - total_exp - agency_comm
        
        return {
            "total_revenue": total_rev,
            "total_expenses": total_exp,
            "agency_commission": agency_comm,
            "owner_payout": net
        }
function renderChart(dataValues) {
    const ctx = document.getElementById('propChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
            datasets: [{
                label: 'Revenus',
                data: dataValues,
                borderColor: '#a855f7',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } }
        }
    });
}
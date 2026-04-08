export const artistChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(10, 10, 10, 0.94)',
      borderColor: 'rgba(29, 185, 84, 0.35)',
      borderWidth: 1,
      titleColor: '#ffffff',
      bodyColor: '#d4d4d8',
      displayColors: false,
      padding: 12,
    },
  },
  scales: {
    x: {
      ticks: {
        color: '#a1a1aa',
        font: {
          size: 11,
          family: 'DM Sans, sans-serif',
        },
      },
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: '#71717a',
        font: {
          size: 11,
          family: 'DM Sans, sans-serif',
        },
      },
      grid: {
        color: 'rgba(255,255,255,0.06)',
        drawBorder: false,
      },
      border: {
        display: false,
      },
    },
  },
  animation: {
    duration: 900,
    easing: 'easeOutQuart',
  },
}
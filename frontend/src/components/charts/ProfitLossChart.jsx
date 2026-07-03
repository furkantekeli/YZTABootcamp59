import React from 'react';
import Chart from 'react-apexcharts';

export default function ProfitLossChart({ data = [] }) {
  if (data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '320px', color: '#64748b' }}>
        Kâr/Zarar grafiği için veri bulunmuyor.
      </div>
    );
  }

  const series = [{
    name: 'Kâr/Zarar',
    data: data.map(item => item.profit_loss || 0)
  }];

  const options = {
    chart: {
      type: 'bar',
      background: 'transparent',
      toolbar: {
        show: false
      },
      foreColor: '#94a3b8'
    },
    plotOptions: {
      bar: {
        colors: {
          ranges: [{
            from: -999999999,
            to: -0.01,
            color: '#ef4444' // red for losses
          }, {
            from: 0,
            to: 999999999,
            color: '#10b981' // green for profits
          }]
        },
        columnWidth: '55%'
      }
    },
    dataLabels: {
      enabled: false
    },
    grid: {
      borderColor: 'rgba(255,255,255,0.05)',
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    xaxis: {
      categories: data.map(item => item.symbol),
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        formatter: (val) => {
          return new Intl.NumberFormat('tr-TR', {
            notation: 'compact',
            compactDisplay: 'short'
          }).format(val);
        }
      }
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val) => {
          const displayCurrency = localStorage.getItem('app_currency') || data[0]?.currency || 'TRY';
          return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(val) + ' ' + displayCurrency;
        }
      }
    }
  };

  return (
    <div className="profit-loss-chart" style={{ width: '100%' }}>
      <Chart
        options={options}
        series={series}
        type="bar"
        width="100%"
        height="320px"
      />
    </div>
  );
}

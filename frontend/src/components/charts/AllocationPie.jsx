import React from 'react';
import Chart from 'react-apexcharts';

export default function AllocationPie({ data = [] }) {
  // Sort and limit to top 7, group remaining as "Diğer"
  const sortedData = [...data].sort((a, b) => b.market_value - a.market_value);
  
  let chartLabels = [];
  let chartSeries = [];

  if (sortedData.length > 7) {
    const top = sortedData.slice(0, 6);
    const other = sortedData.slice(6);
    const otherSum = other.reduce((sum, item) => sum + item.market_value, 0);

    chartLabels = [...top.map(item => item.symbol), 'Diğer'];
    chartSeries = [...top.map(item => item.market_value), otherSum];
  } else {
    chartLabels = sortedData.map(item => item.symbol);
    chartSeries = sortedData.map(item => item.market_value);
  }

  const options = {
    chart: {
      type: 'donut',
      background: 'transparent',
      foreColor: '#94a3b8'
    },
    stroke: {
      show: true,
      colors: ['#1a1f2e'],
      width: 2
    },
    labels: chartLabels,
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '12px',
      markers: {
        radius: 12
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '11px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'bold'
      },
      dropShadow: {
        enabled: false
      }
    },
    theme: {
      mode: 'dark',
      palette: 'palette1'
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              color: '#94a3b8',
              offsetY: -10
            },
            value: {
              show: true,
              fontSize: '18px',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              color: '#f1f5f9',
              offsetY: 10,
              formatter: (val) => {
                return new Intl.NumberFormat('tr-TR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }).format(val);
              }
            },
            total: {
              show: true,
              label: 'Toplam',
              color: '#94a3b8',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              formatter: (w) => {
                const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                return new Intl.NumberFormat('tr-TR', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2
                }).format(total);
              }
            }
          }
        }
      }
    },
    colors: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#f43f5e', '#64748b'],
    tooltip: {
      y: {
        formatter: (val) => {
          return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(val);
        }
      }
    }
  };

  return (
    <div className="allocation-pie-chart" style={{ width: '100%', height: '100%', minHeight: '320px' }}>
      {chartSeries.length > 0 ? (
        <Chart
          options={options}
          series={chartSeries}
          type="donut"
          width="100%"
          height="320px"
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '320px', color: '#64748b' }}>
          Dağılım grafiği için hisse bulunmuyor.
        </div>
      )}
    </div>
  );
}

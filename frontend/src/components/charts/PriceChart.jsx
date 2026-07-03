import React from 'react';
import Chart from 'react-apexcharts';

export default function PriceChart({ symbol, data = [], period = '1mo' }) {
  if (data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '350px', color: '#64748b' }}>
        {symbol} fiyat geçmişi verisi bulunamadı.
      </div>
    );
  }

  // Format data for ApexCharts candlestick
  // y: [Open, High, Low, Close]
  const chartSeries = [{
    data: data.map(point => ({
      x: new Date(point.date),
      y: [point.open, point.high, point.low, point.close]
    }))
  }];

  const options = {
    chart: {
      type: 'candlestick',
      background: 'transparent',
      toolbar: {
        show: true,
        autoSelected: 'zoom',
        tools: {
          download: false,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      },
      foreColor: '#94a3b8'
    },
    title: {
      text: `${symbol} - Fiyat Grafiği (${period.toUpperCase()})`,
      align: 'left',
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
        fontFamily: 'Inter, sans-serif',
        color: '#f1f5f9'
      }
    },
    grid: {
      borderColor: 'rgba(255,255,255,0.05)',
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    xaxis: {
      type: 'datetime',
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      tooltip: {
        enabled: true
      },
      labels: {
        formatter: (val) => {
          return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(val);
        }
      }
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#10b981',   // Green for positive days
          downward: '#ef4444'  // Red for negative days
        },
        wick: {
          useFillColor: true
        }
      }
    },
    tooltip: {
      theme: 'dark'
    }
  };

  return (
    <div className="stock-candlestick-chart" style={{ width: '100%' }}>
      <Chart
        options={options}
        series={chartSeries}
        type="candlestick"
        width="100%"
        height="350px"
      />
    </div>
  );
}

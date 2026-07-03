import React from 'react';
import Chart from 'react-apexcharts';

export default function PerformanceArea({ data = [] }) {
  // If no data, generate some dummy history points for presentation or display empty state
  const chartData = data.length > 0 ? data : [
    { date: '2026-06-25', value: 10000 },
    { date: '2026-06-26', value: 10200 },
    { date: '2026-06-27', value: 10100 },
    { date: '2026-06-28', value: 10400 },
    { date: '2026-06-29', value: 10800 },
    { date: '2026-06-30', value: 10700 },
    { date: '2026-07-01', value: 11200 },
  ];

  const series = [{
    name: 'Portföy Değeri',
    data: chartData.map(d => d.value)
  }];

  const options = {
    chart: {
      type: 'area',
      background: 'transparent',
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      foreColor: '#94a3b8'
    },
    colors: ['#3b82f6'],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 95, 100]
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
      categories: chartData.map(d => {
        // format date from YYYY-MM-DD to DD.MM
        try {
          const parts = d.date.split('-');
          if (parts.length === 3) {
            return `${parts[2]}.${parts[1]}`;
          }
        } catch(e){}
        return d.date;
      }),
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
      x: {
        format: 'dd/MM/yyyy'
      },
      y: {
        formatter: (val) => {
          return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(val) + ' TRY';
        }
      }
    }
  };

  return (
    <div className="performance-area-chart" style={{ width: '100%' }}>
      <Chart
        options={options}
        series={series}
        type="area"
        width="100%"
        height="320px"
      />
    </div>
  );
}

import React from 'react';
import Chart from 'react-apexcharts';

export default function PerformanceArea({ 
  portfolioReturns = [], 
  benchmarkReturns = [], 
  dates = [], 
  benchmarkName = 'BIST-100' 
}) {
  // If no data, generate placeholder history points for cumulative % returns comparison
  const defaultDates = ['2026-06-25', '2026-06-26', '2026-06-27', '2026-06-28', '2026-06-29', '2026-06-30', '2026-07-01'];
  const defaultPortfolio = [0.0, 2.0, 1.0, 4.0, 8.0, 7.0, 12.0];
  const defaultBenchmark = [0.0, 1.5, 0.8, 3.2, 5.0, 4.2, 7.5];

  const finalDates = dates.length > 0 ? dates : defaultDates;
  const finalPortfolio = portfolioReturns.length > 0 ? portfolioReturns : defaultPortfolio;
  const finalBenchmark = benchmarkReturns.length > 0 ? benchmarkReturns : defaultBenchmark;

  const series = [
    {
      name: 'Portföy Getirisi',
      data: finalPortfolio
    },
    {
      name: `${benchmarkName} Getirisi`,
      data: finalBenchmark
    }
  ];

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
    colors: ['#10b981', '#f59e0b'], // Green for portfolio, Orange/Amber for benchmark
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
        opacityFrom: 0.35,
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
      categories: finalDates.map(d => {
        try {
          const parts = d.split('-');
          if (parts.length === 3) {
            return `${parts[2]}.${parts[1]}`;
          }
        } catch(e){}
        return d;
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
          return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
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
          return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
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

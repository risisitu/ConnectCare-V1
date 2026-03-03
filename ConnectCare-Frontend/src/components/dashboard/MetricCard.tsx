import React from 'react';

interface MetricCardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon?: React.ReactNode;
    trend?: {
        value: string;
        isPositive: boolean;
    };
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, trend }) => {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-default dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                    <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                        {value}
                    </h4>
                    {subtitle && (
                        <span className="text-xs font-medium text-gray-400 mt-1 block">
                            {subtitle}
                        </span>
                    )}

                    {trend && (
                        <div className={`mt-2 flex items-center gap-1 text-sm font-medium ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            <span>{trend.value}</span>
                            {trend.isPositive ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                            )}
                        </div>
                    )}
                </div>
                {icon && (
                    <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-primary">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MetricCard;

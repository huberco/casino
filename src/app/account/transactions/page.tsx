'use client';

import React from 'react';
import TransactionHistory from '@/components/table/TransactionHistory';

const TransactionsPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    <TransactionHistory />
                </div>
                <div className="lg:hidden">
                    <p className='text-center'>Transactions History is not available on mobile.</p>
                </div>
            </div>
        </div>
    );
};

export default TransactionsPage;

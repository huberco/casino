import Link from 'next/link';
import React from 'react';

const GameCard = (props: any) => {

    const { game, online } = props;

    return (
        <Link href={`${game?.route}`}>
            <div className="weather-widget cursor-pointer group relative max-w-sm w-full mx-auto bg-gradient-to-br from-gray-900 via-teal-950 to-black rounded-2xl p-6 shadow-xl shadow-teal-600/40 border border-teal-800/50 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-teal-600/60 hover:scale-105">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute w-3 h-3 bg-cyan-400 rounded-full blur-md transition-all duration-500 group-hover:scale-150" style={{ left: '15%', top: '20%' }} />
                    <div className="absolute w-4 h-4 bg-teal-300 rounded-full blur-lg transition-all duration-500 group-hover:scale-125" style={{ right: '25%', bottom: '15%' }} />
                    <div className="absolute w-2 h-2 bg-yellow-400 rounded-full blur transition-all duration-500 group-hover:scale-175" style={{ left: '40%', top: '10%' }} />
                </div>
                <div className="absolute inset-0 border-2 border-transparent rounded-2xl transition-all duration-500 group-hover:border-teal-500/40">
                    <div className="absolute top-0 left-0 w-1/3 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent transition-all duration-500 group-hover:w-full" />
                </div>
                <div className="text-center mb-4 relative z-10">
                    <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300 transition-all duration-500 group-hover:drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]">
                        {game?.name}
                    </p>
                    <p className="text-sm text-gray-400">October 24, 2024</p>
                </div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className='text-4xl group-hover:text-primary'>
                        {game?.icon}
                    </div>
                    <div className="text-right">
                        <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500 group-hover:bg-gradient-to-r group-hover:from-yellow-500 group-hover:to-orange-600 group-hover:text-5xl group-hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">
                            {online}
                        </p>
                        <p className="text-sm text-gray-300">Online Players</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-teal-900/20 rounded-lg text-center backdrop-blur-sm border border-teal-700/40 relative z-10 overflow-hidden">
                </div>
            </div>
        </Link>
    );
}

export default GameCard;

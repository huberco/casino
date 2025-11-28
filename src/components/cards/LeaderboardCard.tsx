import { Image } from '@heroui/react';
import React from 'react';
const COLOR_SET = {
    gold: {
        color: 'bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500',
        border: 'border-yellow-500/20',
        hover: 'hover:border-yellow-500/40',
        shadow: 'hover:shadow-yellow-500/10',
        shadow3xl: 'hover:shadow-3xl',
    },
    silver: {
        color: 'bg-gradient-to-r from-gray-500 via-gray-400 to-gray-500',
        border: 'border-gray-500/20',
        hover: 'hover:border-gray-500/40',
        shadow: 'hover:shadow-gray-500/10',
        shadow3xl: 'hover:shadow-3xl',
    },
    bronze: {
        color: 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600',
        border: 'border-amber-600/20',
        hover: 'hover:border-amber-600/40',
        shadow: 'hover:shadow-amber-600/10',
        shadow3xl: 'hover:shadow-3xl',
    },
}

const LeaderboardCard = (props: any) => {
    const { className, player, rank = "gold" } = props;
    const colorSet = COLOR_SET[rank as keyof typeof COLOR_SET];
    return (
        <div className={`cursor-pointer transform transition-all duration-500 hover:scale-105 hover:-rotate-1 ${className}`}>
            <div className="text-white group rounded-3xl border border-primary/20 bg-gradient-to-tr from-[#0F0F0F] to-[#0B0B0B] shadow-2xl duration-700 z-10 relative backdrop-blur-xl hover:border-primary/40 overflow-hidden hover:shadow-primary/10 hover:shadow-3xl xl:w-[350px] lg:w-[250px] w-[180px] ">
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-green-400/10 opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                    <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-gradient-to-tr from-primary/10 to-transparent blur-3xl opacity-30 group-hover:opacity-50 transform group-hover:scale-110 transition-all duration-700 animate-bounce delay-500" />
                    <div className="absolute top-10 left-10 w-16 h-16 rounded-full bg-primary/5 blur-xl animate-ping" />
                    <div className="absolute bottom-16 right-16 w-12 h-12 rounded-full bg-primary/5 blur-lg animate-ping delay-1000" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000" />
                </div>
                <div className="p-8 relative z-10">
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                            <div className="absolute inset-0 rounded-full border border-primary/10 animate-pulse delay-500" />
                            <div className="rounded-full backdrop-blur-lg border border-primary/20 bg-gradient-to-br from-black/80 to-gray-900/60 shadow-2xl transform group-hover:rotate-180 group-hover:scale-110 transition-all duration-500 hover:shadow-primary/20">
                                <div className="transform group-hover:rotate-180 transition-transform duration-700 rounded-full">
                                    <Image src={player?.avatar} alt={player?.username} width={60} height={60} className="rounded-full block md:hidden" />
                                    <Image src={player?.avatar} alt={player?.username} width={80} height={80} className="rounded-full md:block hidden" />
                                </div>
                            </div>
                        </div>
                        <div className="mb-4 transform group-hover:scale-105 transition-transform duration-300">
                            <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-400 via-primary to-green-400 bg-clip-text text-transparent animate-pulse truncate lg:max-w-[200px] max-w-[150px]" title={player?.displayName}>
                                {player?.displayName || player?.username}
                            </p>
                            <p className="text-gray-300 text-sm leading-relaxed transform group-hover:text-gray-200 transition-colors duration-300">
                                Level {player?.level}
                            </p>
                        </div>
                        <div className="w-full bg-primary/10 rounded-lg">
                            
                            <p className="text-gray-300 text-sm leading-relaxed transform group-hover:text-gray-200 transition-colors duration-300">
                                {player?.totalWagered.toFixed(2).replace(/\.?0+$/, '') || 0}
                            </p>
                        </div>
                        <div className="mt-2 w-1/3 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full transform group-hover:w-1/2 group-hover:h-1 transition-all duration-500 animate-pulse" />
                        <div className="flex space-x-2 mt-4 opacity-60 items-end group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                            <p className='text-3xl'>{rank === "gold" ? "🏆" : rank === "silver" ? "🥈" : "🥉"}</p>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-br-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-primary/10 to-transparent rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
        </div>
    );
}

export default LeaderboardCard;

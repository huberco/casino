import { Badge, Image } from "@heroui/react";
import { useEffect, useState } from "react";
import { FaDollarSign } from "react-icons/fa6";

const CoinflipCard = (props: any) => {
    const { game, selfRemove, requestBalanceUpdate } = props;
    const [flipping, setFlipping] = useState(false);
    const [countDown, setCountDown] = useState(5);
    const [showResult, setShowResult] = useState(false);

    const flipCoinAnimation = () => {
        if (flipping) return; // Prevent multiple flips
        setFlipping(true);
        setTimeout(() => {
            setFlipping(false);
            setShowResult(true);
            requestBalanceUpdate();
            // After showing result for 3 seconds, call selfRemove
            setTimeout(() => {
                selfRemove(game.gameId);
            }, 5000);
        }, 3000); // Duration of the flip animation
    };
    useEffect(() => {
        const interval = setInterval(() => {
            if (countDown > 0) {
                setCountDown(countDown - 1);
            }
            else {
                clearInterval(interval)
                flipCoinAnimation();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [countDown]);

    return (
        <div key={game.gameId} className={`group transition duration-500 bg-background-alt w-full cursor-pointer backdrop-blur-sm relative rounded-2xl p-[2px] border border-gray-700/50 `}>
            <div className='z-50 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
                {countDown === 0 ? <div
                    className={` sprite-animation mx-auto`}
                    style={{
                        zIndex: 1000,
                        width: '248px',
                        height: '248px',
                        rotate: '45deg',
                        backgroundImage: `url(/assets/images/tokens/coinflip_${game.coinResult}.png)`,
                        backgroundSize: '248px 12648px',
                        backgroundPosition: flipping ? '0px -12648px' : '0px 248px',
                        transition: flipping ? 'background-position 3s steps(52)' : ''
                    }}
                /> :
                    <div className="relative">
                        <p className="text-primary text-4xl font-bold animate-ping absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">{countDown}</p>
                        <p className="text-primary text-4xl font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">{countDown}</p>
                    </div>
                }
            </div>
            {showResult && countDown === 0 && <div
                className={`absolute -inset-1 bg-gradient-to-r from-emerald-600 to-sky-600 rounded-xl blur  ${showResult ? "opacity-50" : "opacity-0"} transition duration-500`}
            ></div>}
            {countDown === 0 && showResult && <div className={`flex  p-1 absolute left-0 top-0 h-full w-full rounded-xl from-primary to-red-500 ${game.coinSide === game.coinResult ? 'bg-gradient-to-r justify-start' : 'bg-gradient-to-l justify-end'}`}>
                <Image src="/assets/images/winner.png" width={40} height={40} classNames={{
                    wrapper: "w-[100px] h-[100px]"
                }} />
            </div>}
            <div className='bg-gradient-to-b from-white/10 to-transparent w-full relative p-1 rounded-xl'>
                <div className='bg-background-alt/80 w-full relative p-4 rounded-lg'>
                    <div className="text-center flex lg:flex-row flex-col gap-4 justify-between items-center">
                        <div className='flex items-center gap-4 justify-between w-full'>
                            <div className='flex gap-2 justify-start items-center '>
                                <div>
                                    <Badge isOneChar color="success" content={<Image src={`/assets/images/tokens/${game?.coinSide || 'heads'}.svg`} alt={game.creator?.coin || 'heads'} width={20} height={20} />} placement="bottom-right">
                                        <Image
                                            src={game.creator?.avatar}
                                            alt={game.creator?.displayName || game.creator?.username}
                                            className="w-14 h-14 rounded-full"
                                        />
                                    </Badge>
                                </div>

                                <div className='flex flex-col items-start justify-center'>
                                    <h4 className="text-white font-bold ">{game.creator?.displayName || game.creator?.username}</h4>
                                    <p className="text-gray-400 text-sm ">Level {game.creator?.level}</p>
                                </div>
                            </div>
                            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                                <div className="px-1 rounded-lg bg-background-alt/50 text-primary">
                                    <span className="font-bold">{game.betAmount.toFixed(2)}</span>
                                </div>
                                <Image src={`/assets/images/vs.png`} alt='vs' width={60} />
                            </div>
                            <div className='flex gap-2 justify-start flex-row-reverse items-center'>
                                <Badge isOneChar color="success" content={<Image src={`/assets/images/tokens/${game.coinSide === 'heads' ? 'tails' : 'heads'}.svg`} alt={game.creator?.coin || 'heads'} width={20} height={20} />} placement="bottom-right">
                                    <Image
                                        src={game.joiner.avatar}
                                        alt={game.joiner?.displayName || game.joiner?.username}
                                        className="w-14 h-14 rounded-full"
                                    />
                                </Badge>


                                <div className='flex flex-col items-end justify-center'>
                                    <h4 className="text-white font-bold text-right">{game.joiner?.displayName || game.joiner?.username}</h4>
                                    <p className="text-gray-400 text-sm text-right ">Level {game.joiner?.level}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    )
}
export default CoinflipCard;
import React, { useEffect, useState } from "react";
import { StyledCryptoCoin } from "@/components/common/CryptoFuturesCoins/styles";
import { Image } from "@heroui/react";
import Link from "next/link";

interface CryptoCoin {
  icon: string;
  name: string;
  price: number | string;
  increased?: boolean;
}

const cryptoCoins: CryptoCoin[] = [
  {
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    name: "BTC",
    price: 35646.69,
  },
  {
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
    name: "ETH",
    price: 2587.23,
  },
  {
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    name: "BTC",
    price: 35646.69,
  },
  {
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
    name: "ETH",
    price: 2587.23,
  },
  {
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    name: "BTC",
    price: 35646.69,
  },
  {
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
    name: "ETH",
    price: 2587.23,
  },
  {
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    name: "BTC",
    price: 35646.69,
  },
  {
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
    name: "ETH",
    price: 2587.23,
  },
  {
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    name: "BTC",
    price: 35646.69,
  },
  {
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
    name: "ETH",
    price: 2587.23,
  },
  {
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    name: "BTC",
    price: 35646.69,
  },
  {
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
    name: "ETH",
    price: 2587.23,
  },
  {
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    name: "BTC",
    price: 35646.69,
  },
  {
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
    name: "ETH",
    price: 2587.23,
  },
  // Add more coins as needed
];

const CryptoFuturesCoins = () => {
  const [coins, setCoins] = useState<CryptoCoin[]>(cryptoCoins);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCoins((prevCoins) => {
        return prevCoins.map((coin) => {
          // Generate a random value within the range of -100 to 100
          const randomChange = Math.random() * 200 - 100;
          // Get current price as number
          const currentPrice = typeof coin.price === "string" ? parseFloat(coin.price) : coin.price;
          // Calculate the new price
          const newPrice = currentPrice + randomChange;
          // Determine if the price increased or decreased
          const increased = newPrice > currentPrice;

          return {
            ...coin,
            price: newPrice.toFixed(2), // Round to 2 decimal places
            increased: increased,
          };
        });
      });
    }, 1000); // Update every 1 second

    // Clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Remove coins from dependency array to avoid infinite loop

  const filteredCoins = coins.filter((coin) =>
    coin.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <StyledCryptoCoin style={{ paddingBottom: "12px" }}>
      <div style={{ padding: "10px 6px 8px" }}>
        <div className="container-coins">
          <input
            className="search-bar"
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {filteredCoins.length === 0 ? (
            <div className="no-results">No results</div>
          ) : (
            filteredCoins.map((coin, index) => (
              <Link
                key={index}
                className="coin-container"
                href="/"
                style={{ fontSize: "13px" }}
              >
                <Image
                  src={coin.icon}
                  className="coin-icon"
                  alt="icon"
                />
                <div className="coin-name">{coin.name}</div>
                <div className="coin-price">{coin.price}</div>
                <svg
                  width="8"
                  height="10"
                  viewBox="0 0 8 10"
                  xmlns="http://www.w3.org/2000/svg"
                  className="increase-icon"
                  style={{
                    marginLeft: "12px",
                    rotate: coin.increased ? "180deg" : "0deg",
                    color: coin.increased ? "#72f238" : "#FF4949",
                  }}
                >
                  <path
                    d="M8 4.449L4 7.357 0 4.449v2.643L4 10l4-2.908V4.45zM8 0L4 2.908 0 0v2.643l4 2.908 4-2.908V0z"
                    fill="currentColor"
                    fillRule="evenodd"
                  ></path>
                </svg>
              </Link>
            ))
          )}
        </div>
      </div>
    </StyledCryptoCoin>
  );
};

export default CryptoFuturesCoins;

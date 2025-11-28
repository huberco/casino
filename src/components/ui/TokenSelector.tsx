import React from "react";
import type { SelectedItems } from "@heroui/react";
import { Select, SelectItem, Image } from "@heroui/react";

export default function TokenSelector() {
    // const { tokens, selectedToken, selectToken, isLoading } = useToken();
    
    // const handleSelectionChange = (e: any) => {
    //     if (e.target.value) {
    //         selectToken(e.target.value);
    //     }
    // }
    // return (
    //     <Select
    //         defaultSelectedKeys={selectedToken ? [selectedToken.id] : []}
    //         classNames={{
    //             base: " bg-background",
    //             trigger: "h-12 bg-background cursor-pointer hover:bg-background! focus:bg-background border border-gray-700/50 rounded-lg",
    //             label: "hidden",
    //             innerWrapper: "p-0!",
    //             mainWrapper: "bg-background-alt",
    //             popoverContent: "bg-background-alt",
    //         }}
    //         label="Token"
    //         selectedKeys={selectedToken ? [selectedToken.id] : []}
    //         onChange={handleSelectionChange}
    //         items={tokens}
    //         placeholder={isLoading ? "Loading tokens..." : "Select a token"}
    //         isDisabled={isLoading || tokens.length === 0}
    //         listboxProps={{
    //             itemClasses: {
    //                 base: [
    //                     "rounded-md",
    //                     "text-default-500",
    //                     "transition-opacity",
    //                     "data-[hover=true]:text-foreground",
    //                     "data-[hover=true]:bg-background-alt",
    //                     "dark:data-[hover=true]bg-primary",
    //                     "data-[pressed=true]:opacity-70",
    //                     "data-[focus-visible=true]:ring-default-500",
    //                 ],
    //             },
    //         }}
    //         popoverProps={{
    //             classNames: {
    //                 base: "before:bg-default-200",
    //                 content: "p-0 border-small border-divider bg-background",
    //             },
    //         }}
    //         renderValue={(items: SelectedItems<any>) => {
    //             return items.map((item) => (
    //                 <div key={item.key} className="flex items-center gap-2 justify-between">
    //                     <div className="flex gap-2 items-center">
    //                         <Image alt={item.data?.name} className="shrink-0 w-8" src={item.data?.image} />
    //                         <div className="flex flex-col">
    //                             <span>{item.data?.name}</span>
    //                             <span className="text-default-500 text-tiny">({item.data?.symbol})</span>
    //                         </div>
    //                     </div>
    //                     <span className="text-default-500 text-tiny">{item.data?.balance.toFixed(2).replace(/\.?0+$/, "")}</span>
    //                 </div>
    //             ));
    //         }}
    //     >
    //         {(token: any) => (
    //             <SelectItem key={token.id} textValue={token.name}>
    //                 <div className="flex gap-2 items-center justify-between">
    //                     <div className="flex gap-2 items-center">
    //                         <Image alt={token.name} className="shrink-0 w-8" src={token.image} />
    //                         <div className="flex flex-col">
    //                             <span className="text-small">{token.name}</span>
    //                             <span className="text-tiny text-default-400">{token.symbol}</span>
    //                         </div>
    //                     </div>
    //                     <span className="text-default-500 text-tiny">{token.balance.toFixed(2).replace(/\.?0+$/, "")}</span>
    //                 </div>
    //             </SelectItem>
    //         )}
    //     </Select>
    // );
    return (
        <div>
            <h1>Token Selector</h1>
        </div>
    );
}

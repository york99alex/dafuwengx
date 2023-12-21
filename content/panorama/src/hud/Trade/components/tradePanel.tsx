import { useMemo, useState } from 'react';
import AuctionActivePanel from './auctionActivePanel';
import TradeActivePanel from './tradeActivePanel';
import { PlayerManager } from '../../player/playerManager';

export function TradePanel() {
    const [isTradeOpen, setIsTradeOpen] = useState(false);
    const [isAuctionOpen, setIsAuctionOpen] = useState(false);

    function openTradePanel() {
        if (isTradeOpen) return;
        setIsTradeOpen(true);
        setIsAuctionOpen(false);
    }

    return (
        <Panel className="TradeBody" hittest={false}>
            <Button
                className="ButtonBevel TradeButton Trade"
                onactivate={() => {
                    setIsTradeOpen(!isTradeOpen);
                    setIsAuctionOpen(false);
                }}
            >
                <Label className="ButtonText" text={$.Localize(`#TradeButtonText`)} />
            </Button>
            {isTradeOpen && <TradeActivePanel openTradePanel={openTradePanel} />}
            {isAuctionOpen && <AuctionActivePanel />}
            <Button
                className="ButtonBevel TradeButton"
                onactivate={() => {
                    setIsTradeOpen(false);
                    setIsAuctionOpen(!isAuctionOpen);
                }}
            >
                <Label className="ButtonText" text={$.Localize(`#AuctionButtonText`)} />
            </Button>
        </Panel>
    );
}

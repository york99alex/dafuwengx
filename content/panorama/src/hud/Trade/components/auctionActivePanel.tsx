export default function AuctionActivePanel() {
    return (
        <Panel className="AuctionActivePanel" hittest={true}>
            <Label className="TradeTitle" text={$.Localize(`#AuctionTitle`)} />
        </Panel>
    );
}

import { HandCard } from '../handCard';

export default function Card({ card }: { card: HandCard }) {
    console.log(card);
    return (
        <Panel className="CardContainer" hittest={true}>
            <Label
                style={{ fontSize: '40px' }}
                text={card.nCardID + '\n' + card.cardType + '\n' + card.cardKind + '\n' + card.cardType + '\n' + card.nManaCost}
            />
        </Panel>
    );
}

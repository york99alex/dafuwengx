import { useState } from 'react';
import { TRADESTATE } from '../../mode/constant';

export default function SelectPlayerList(props: { ids: PlayerID[]; selectPlayerID: number; SetSelectPlayerID: Function; tradeState: number }) {
    const [isSelect, setSelect] = useState(false);

    return (
        <>
            {props.ids.map((id, index) => (
                <Button
                    key={index}
                    className={'PlayerSelectButton' + (props.selectPlayerID == index && isSelect ? ' Select' : '')}
                    onactivate={() => {
                        if (props.tradeState != TRADESTATE.None) return;
                        if (props.selectPlayerID == index && isSelect) {
                            props.SetSelectPlayerID(-1);
                            setSelect(!isSelect);
                        } else props.SetSelectPlayerID(index);

                        if (!isSelect) setSelect(!isSelect);
                    }}
                >
                    <DOTAHeroImage heroname={Players.GetPlayerSelectedHero(id)} heroimagestyle="icon" />
                </Button>
            ))}
        </>
    );
}

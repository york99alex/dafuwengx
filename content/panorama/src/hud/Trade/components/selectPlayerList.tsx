import { useState } from 'react';

export default function SelectPlayerList(props: { ids: PlayerID[]; selectPlayerID: number; SetSelectPlayerID: Function }) {
    const [isSelect, setSelect] = useState(false);

    return (
        <>
            {props.ids.map((id, index) => (
                <Button
                    key={index}
                    className={'PlayerSelectButton' + (props.selectPlayerID == index && isSelect ? ' Select' : '')}
                    onactivate={() => {
                        if (props.selectPlayerID == index && isSelect) {
                            props.SetSelectPlayerID(-1);
                            setSelect(!isSelect);
                        } else props.SetSelectPlayerID(index);

                        if (!isSelect) setSelect(!isSelect);
                    }}
                    onmouseover={() => $.GetContextPanel().AddClass('hover')}
                >
                    <DOTAHeroImage heroname={Players.GetPlayerSelectedHero(id)} heroimagestyle="icon" />
                </Button>
            ))}
        </>
    );
}

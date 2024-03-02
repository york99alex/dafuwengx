import { useEffect, useState } from 'react';
import { useNetTableKey } from 'react-panorama-x';

export function GameClock() {
    const [isDay, setIsDay] = useState(true);
    const [time, setTime] = useState('0:0');
    const { nRound } = useNetTableKey('GamingTable', 'round') ?? { nRound: 0 };

    useEffect(() => {
        updateTime();
    }, []);

    function updateTime() {
        const time = Math.floor(Math.abs(Game.GetDOTATime(false, true)));
        const min = Math.floor(time / 60);
        const sec = time % 60;
        setTime(min + ':' + (sec < 10 ? '0' + sec : sec));
        setIsDay(min % 10 < 5);
        $.Schedule(1, updateTime);
    }

    return (
        <Panel className="GameClock" hittest={false}>
            <Panel className="Flag" />
            <Panel className={'GameClockIcon' + (isDay ? ' Day' : ' Night')} />
            <Label className="GameClockTime" text={time} />
            <Panel className="Round" />
            <Label className="RoundText" html={true} text={$.Language() == 'schinese' ? '第' + nRound + '回合' : 'Round<br>' + nRound} />
        </Panel>
    );
}

import { useGameEvent } from 'react-panorama-x';

export function HudError() {
    useGameEvent('S2C_GM_HUDErrorMessage', event => {
        if (event.type == 0) {
        } else if (event.type == 1) {
            console.log("[DisplayHudError]:", event.message);
        }
        GameEvents.SendEventClientSide('dota_hud_error_message',{
            "sequenceNumber": 0,
            "reason": 80,
            "message": event.message
        })
    });

    return <></>;
}

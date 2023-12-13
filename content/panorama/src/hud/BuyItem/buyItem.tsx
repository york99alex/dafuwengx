import { useNetTableKey } from 'react-panorama-x';
import { player_info } from '../mode/constant';

export function BuyItem() {
    const keyname = ('player_info_' + Players.GetLocalPlayer()) as player_info;
    const nBuyCount = useNetTableKey('GamingTable', keyname)!.nBuyItem;

    return <Label className='BuyItem'
    text={`购买次数：` + nBuyCount} />;
}

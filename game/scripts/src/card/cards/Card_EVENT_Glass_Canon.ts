import { AbilityManager } from '../../ability/abilitymanager';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';
import { Card } from '../card';
import { modifier_bloodseeker_bloodrage_card } from './Card_BUFF_Bloodrage';

/**玻璃大炮 30007 */
export class Card_EVENT_Glass_Canon extends Card {
    m_sName: string = '玻璃大炮';
    isCanCastMove(): boolean {
        return true;
    }
    isCanCastInPrison(): boolean {
        return true;
    }
    isCanCastHeroAtk(): boolean {
        return true;
    }
    isCanCastInPrisonTarget(): boolean {
        return true;
    }
    isCanCastBattleTarget(): boolean {
        return true;
    }
    isCanCastMonster(): boolean {
        return true;
    }
    isCanCastSelf(): boolean {
        return true;
    }

    OnSpellStart(): void {
        const player = this.GetOwner();
        // 设置眩晕BUFF
        for (const eBZ of player.m_tabBz) {
            AbilityManager.setCopyBuff(modifier_bloodseeker_bloodrage_card.name, eBZ, player.m_eHero, null);
        }
        const buff = AbilityManager.setCopyBuff(modifier_bloodseeker_bloodrage_card.name, player.m_eHero, player.m_eHero, null);
        // 兵卒创建更新buff
        if (buff) {
            buff['updateBZBuffByCreate'] = AbilityManager.updateBZBuffByCreate(player, null, (eBZ: CDOTA_BaseNPC_BZ) => {
                AbilityManager.setCopyBuff(modifier_bloodseeker_bloodrage_card.name, eBZ, player.m_eHero, null);
            });
        }

        EmitGlobalSound('hero_bloodseeker.bloodRage');
    }
}

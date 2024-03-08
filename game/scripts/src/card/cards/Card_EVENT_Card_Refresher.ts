import { AMHC, IsValid } from '../../utils/amhc';
import { Card } from '../card';

/**刷新球碎片 30009 */
export class Card_EVENT_Card_Refresher extends Card {
    m_sName: string= '刷新球碎片';
    OnSpellStart(): void {
        // 特效
        AMHC.CreateParticle('particles/items2_fx/refresher.vpcf', ParticleAttachment.POINT, false, this.GetCaster(), 2);
        // 音效
        EmitGlobalSound('DOTA_Item.Refresher.Activate');

        // 重置技能CD
        for (let i = 0; i <= 23; i++) {
            const ability = this.GetCaster().GetAbilityByIndex(i);
            if (ability != null && !ability.IsCooldownReady()) {
                GameRules.EventManager.FireEvent('Event_LastCDChange', {
                    strAbltName: ability.GetAbilityName(),
                    entity: this.GetCaster(),
                    nCD: 0,
                });
            }
        }
        const tRefresh = {};
        tRefresh['item_qtg_refresher'] = true;
        // 重置物品CD
        for (let i = 0; i <= 8; i++) {
            const item = this.GetCaster().GetItemInSlot(i);
            if (IsValid(item) && !item.IsCooldownReady() && !tRefresh[item.GetAbilityName()]) {
                tRefresh[item.GetAbilityName()] = true;
                GameRules.EventManager.FireEvent('Event_LastCDChange', {
                    strAbltName: item.GetAbilityName(),
                    entity: this.GetCaster(),
                    nCD: 0,
                });
            }
        }
    }
}

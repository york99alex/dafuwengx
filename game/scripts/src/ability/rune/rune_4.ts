import { Player } from '../../player/player';
import { AHMC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { ParaAdjuster } from '../../utils/paraadjuster';
import { TSBaseAbility } from '../tsBaseAbilty';

/**
 * 符文技能：回复神符
 */
@registerAbility()
export class rune_4 extends TSBaseAbility {
    GetIntrinsicModifierName() {
        return 'modifier_' + this.GetAbilityName();
    }
}

/**
 * 符文技能modifier：回复神符
 */
@registerModifier()
export class modifier_rune_4 extends BaseModifier {
    GetTexture(): string {
        return 'rune_regen';
    }
    IsPassive() {
        return true;
    }
    GetEffectName(): string {
        return 'particles/generic_gameplay/rune_regen_owner.vpcf';
    }
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.ABSORIGIN_FOLLOW;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        if (IsClient()) return;
        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID());
        if (!oPlayer) {
            return;
        }
        const ability = this.GetAbility();

        // 设置玩家全部单位满蓝满血
        oPlayer.m_eHero.ModifyHealth(oPlayer.m_eHero.GetMaxHealth(), null, false, 0);
        oPlayer.setPlayerMana(oPlayer.m_eHero.GetMaxMana());

        // 加蓝特效
        let nPtclID = AHMC.CreateParticle(
            'particles/econ/items/outworld_devourer/od_shards_exile/od_shards_exile_prison_start.vpcf',
            ParticleAttachment.OVERHEAD_FOLLOW,
            false,
            oPlayer.m_eHero,
            2
        );
        ParticleManager.SetParticleControl(nPtclID, 0, oPlayer.m_eHero.GetAbsOrigin());
        ParticleManager.SetParticleControl(nPtclID, 1, oPlayer.m_eHero.GetAbsOrigin());
        // 给玩家全部兵卒buff
        for (const eBZ of oPlayer.m_tabBz) {
            eBZ.ModifyHealth(eBZ.GetMaxHealth(), null, false, 0);
            eBZ.SetMana(eBZ.GetMaxMana());
            nPtclID = AHMC.CreateParticle(
                'particles/econ/items/outworld_devourer/od_shards_exile/od_shards_exile_prison_start.vpcf',
                ParticleAttachment.OVERHEAD_FOLLOW,
                false,
                eBZ,
                2
            );
            ParticleManager.SetParticleControl(nPtclID, 0, eBZ.GetAbsOrigin());
            ParticleManager.SetParticleControl(nPtclID, 1, eBZ.GetAbsOrigin());
        }

        // 监听持续时间回合结束
        const nRoundEnd = GameRules.GameConfig.m_nRound + ability.GetSpecialValueFor('duration') - 1;
        GameRules.EventManager.Register('Event_PlayerRoundFinished', (oPlayerFinished: Player) => {
            if (nRoundEnd == GameRules.GameConfig.m_nRound && oPlayerFinished == oPlayer && oPlayer.m_bRoundFinished) {
                // 移除buff
                if (!ability.IsNull()) AHMC.RemoveAbilityAndModifier(oPlayer.m_eHero, ability.GetAbilityName());
                return true;
            }
        });

        const parent = this.GetParent();
        if (parent.IsRealHero()) ParaAdjuster.ModifyMana(parent);
    }

    OnDestroy(): void {
        const parent = this.GetParent();
        if (parent.IsRealHero()) ParaAdjuster.ModifyMana(parent);
    }
}

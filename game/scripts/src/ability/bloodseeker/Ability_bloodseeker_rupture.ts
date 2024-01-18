import { Player } from '../../player/player';
import { AMHC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { AbilityManager } from '../abilitymanager';
import { TSBaseAbility } from '../tsBaseAbilty';

/**
 * 
    DOTA_Tooltip_ability_Ability_bloodseeker_rupture,,割裂
    DOTA_Tooltip_ability_Ability_bloodseeker_rupture_Description,,让一个敌方单位皮开肉绽，将根据移动格数受到当前生命比例伤害。
    DOTA_Tooltip_ability_Ability_bloodseeker_rupture_Lore,,当血魔猎杀你时，受伤就意味着死亡。
    DOTA_Tooltip_ability_Ability_bloodseeker_rupture_duration,,持续回合 :
    DOTA_Tooltip_ability_Ability_bloodseeker_rupture_damage,,% 损失当前生命 :
    DOTA_Tooltip_modifier_ability_rupture,,割裂
    DOTA_Tooltip_modifier_ability_rupture_Description,,移动损失当前生命，持续 <font color='#FF0000'>%dMODIFIER_PROPERTY_BONUS_DAY_VISION%</font> 回合。
 */
@registerAbility()
export class Ability_bloodseeker_rupture extends TSBaseAbility {
    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        return 0;
    }

    /**选择目标时 */
    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (!IsValid(target)) return UnitFilterResult.FAIL_CUSTOM;

        if (!this.isCanCast(target)) return UnitFilterResult.FAIL_CUSTOM;

        return UnitFilterResult.SUCCESS;
    }

    isCanCastSelf(): boolean {
        return false;
    }

    /**开始技能效果 */
    OnSpellStart(): void {
        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
        const target = this.GetCursorTarget();

        // 音效
        EmitGlobalSound('hero_bloodseeker.rupture.cast');

        // 添加buff
        AbilityManager.setCopyBuff(modifier_ability_rupture.name, target, this.GetCaster(), this);
        EmitGlobalSound('Hero_Axe.Battle_Hunger');

        // 触发耗蓝
        GameRules.EventManager.FireEvent('Event_HeroManaChange', { player: oPlayer, oAblt: this });
        // 设置冷却
        AbilityManager.setRoundCD(oPlayer, this);
    }
}

/**割裂buff */
@registerModifier()
export class modifier_ability_rupture extends BaseModifier {
    m_tEventID: number[];
    m_nRound: number;
    m_nDamage: number;
    player: Player;

    IsHidden(): boolean {
        return false;
    }

    IsDebuff(): boolean {
        return true;
    }

    IsPurgable(): boolean {
        return true;
    }

    GetTexture(): string {
        return 'bloodseeker_rupture';
    }

    GetEffectName(): string {
        return 'particles/units/heroes/hero_bloodseeker/bloodseeker_rupture.vpcf';
    }

    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.POINT_FOLLOW;
    }

    OnDestroy(): void {
        if (IsClient()) return;
        GameRules.EventManager.UnRegisterByIDs(this.m_tEventID);
    }

    OnCreated(params: object): void {
        this.m_nRound = this.GetAbility().GetSpecialValueFor('duration');
        this.m_nDamage = this.GetAbility().GetSpecialValueFor('damage');

        if (IsClient() || !this.GetParent().IsRealHero()) return;
        this.player = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID());
        if (!this.player) return;

        AbilityManager.judgeBuffRound(this.GetCaster().GetPlayerOwnerID(), this);

        this.m_tEventID = [];
        // 监听移动
        this.m_tEventID.push(
            GameRules.EventManager.Register(
                'Event_Move',
                (event: { entity: CDOTA_BaseNPC_Hero }) => {
                    if (event.entity != this.GetParent()) return;
                    const oPlayer = GameRules.PlayerManager.getPlayer(event.entity.GetPlayerOwnerID());
                    const tEventID = [];
                    tEventID.push(
                        GameRules.EventManager.Register('Event_CurPathChange', (event2: { player: Player }) => {
                            if (event2.player == oPlayer) {
                                const nDamage = this.GetParent().GetHealth() * this.m_nDamage * 0.01;
                                AMHC.Damage(this.GetCaster(), this.GetParent(), nDamage, this.GetAbility().GetAbilityDamageType(), this.GetAbility());
                                return;
                            }
                        })
                    );
                    tEventID.push(
                        GameRules.EventManager.Register('Event_MoveEnd', (event3: { entity: CDOTA_BaseNPC_Hero }) => {
                            if (event.entity == event3.entity) GameRules.EventManager.UnRegisterByIDs(tEventID);
                        })
                    );
                },
                this
            )
        );
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.BONUS_DAY_VISION];
    }
    GetBonusDayVision(): number {
        return this.m_nRound;
    }
}

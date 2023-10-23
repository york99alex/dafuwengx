import { PS_InPrison, TP_DOMAIN_7 } from "../../mode/gamemessage";
import { Path } from "../../path/Path";
import { PathDomain } from "../../path/pathsdomain/pathdomain";
import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";
import { DamageEvent, Player } from "../../player/player";
import { AHMC } from "../../utils/amhc";
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { AbilityManager } from "../abilitymanager";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 路径技能：圣所
 */
@registerAbility()
export class path_18 extends TSBaseAbility {
    GetIntrinsicModifierName() {
        return "modifier_" + this.GetAbilityName() + "_l" + this.GetLevel()
    }
}

/**
 * 路径技能：圣所
 */
@registerModifier()
export class modifier_path_18_l1 extends BaseModifier {
    oPlayer: Player
    unUpdateBZBuffByCreate: Function
    tEventID: number[]
    damage: number
    IsHidden(): boolean {
        return false
    }
    IsDebuff(): boolean {
        return false
    }
    IsPurgable(): boolean {
        return false
    }
    GetTexture(): string {
        return "path18"
    }
    OnDestroy(): void {
        if (this.oPlayer) {
            for (const eBZ of this.oPlayer.m_tabBz) {
                if (IsValidEntity(eBZ) && eBZ.m_path.m_typePath == TP_DOMAIN_7) {
                    eBZ.RemoveModifierByName(this.GetName())
                    eBZ.RemoveModifierByNameAndCaster("modifier_medusa_stone_gaze_stone", this.oPlayer.m_eHero)
                }
            }
        }
        if (this.unUpdateBZBuffByCreate) {
            this.unUpdateBZBuffByCreate()
        }
        if (this.tEventID) {
            for (const nID of this.tEventID) {
                GameRules.EventManager.UnRegisterByID(nID)
            }
        }
    }
    OnCreated(params: object): void {
        if (!IsValidEntity(this)) {
            return
        }
        if (!IsValidEntity(this.GetAbility())) {
            return
        }
        const ability = this.GetAbility()
        const typeDamage = DamageTypes.PURE
        this.damage = ability.GetSpecialValueFor("damage")
        if (IsClient() || !this.GetParent().IsRealHero()) {
            return
        }
        this.oPlayer = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID())
        if (!this.oPlayer) {
            return
        }
        this.tEventID = []

        // 给玩家兵卒buff
        Timers.CreateTimer(0.1, () => {
            if (IsValidEntity(this) && IsValidEntity(this.GetAbility())) {
                for (const eBZ of this.oPlayer.m_tabBz) {
                    if (eBZ.m_path.m_typePath == TP_DOMAIN_7)
                        eBZ.AddNewModifier(this.oPlayer.m_eHero, this.GetAbility(), this.GetName(), {})
                }
                this.unUpdateBZBuffByCreate = AbilityManager.updateBZBuffByCreate(this.oPlayer, this.GetAbility(), (eBZ: CDOTA_BaseNPC_BZ) => {
                    if (eBZ.m_path.m_typePath == TP_DOMAIN_7 && IsValidEntity(eBZ)) {
                        eBZ.AddNewModifier(this.oPlayer.m_eHero, this.GetAbility(), this.GetName(), {})
                        Timers.CreateTimer(0.5, () => {
                            if (IsValidEntity(ability)) {
                                eBZ.AddNewModifier(this.oPlayer.m_eHero, this.GetAbility(), "modifier_medusa_stone_gaze_stone", null)
                            }
                        })
                    }
                })
            }
        })
        // 石化兵卒
        Timers.CreateTimer(0.5, () => {
            if (ability.IsNull()) {
                return
            }
            for (const v of this.oPlayer.m_tabBz) {
                if (v.m_path.m_typePath == TP_DOMAIN_7 && !v.HasModifier("modifier_medusa_stone_gaze_stone")) {
                    v.AddNewModifier(this.oPlayer.m_eHero, ability, "modifier_medusa_stone_gaze_stone", null)
                }
            }
        })

        // 监听单位触发路径
        this.tEventID.push(GameRules.EventManager.Register("Event_OnPath", (event: { path: Path, entity: CDOTA_BaseNPC_Hero }) => {
            if (event.path.m_typePath != TP_DOMAIN_7 || event.entity.GetPlayerOwnerID() == this.oPlayer.m_nPlayerID) {
                return
            }
            if (ability.IsNull()) {
                return true
            }
            if (0 < bit.band(PS_InPrison, this.oPlayer.m_nPlayerState)) {
                return
            }

            // 圣光特效
            AHMC.CreateParticle("particles/econ/items/omniknight/hammer_ti6_immortal/omniknight_purification_ti6_immortal.vpcf"
                , ParticleAttachment.POINT, false, event.entity)
            EmitGlobalSound("Hero_Omniknight.Purification")

            // 造成伤害
            const nEventID = GameRules.EventManager.Register("Event_Atk", (event2: DamageEvent) => {
                if (event2.damagetype_const == typeDamage) {
                    event2.damage = this.damage
                }
            }, null, 987654321)
            AHMC.Damage(this.oPlayer.m_eHero, event.entity, this.damage, typeDamage, ability)
            GameRules.EventManager.UnRegisterByID(nEventID, "Event_Atk")
        }))

        // 监听触发攻城
        this.tEventID.push(GameRules.EventManager.Register("Event_GCLDReady", (event: {
            entity: CDOTA_BaseNPC_Hero,
            path: PathDomain,
            bIgnore?: boolean,
        }) => {
            if (event.path.m_typePath != TP_DOMAIN_7 || event.entity.GetPlayerOwnerID() == this.oPlayer.m_nPlayerID) {
                return
            }
            if (ability.IsNull()) {
                return true
            }
            event.bIgnore = true
        }))
        // 已经在攻城
        const tPaths = GameRules.PathManager.getPathByType(TP_DOMAIN_7) as PathDomain[]
        for (const path of tPaths) {
            if (path.m_nPlayerIDGCLD != null) {
                path.atkCityEnd(false)
            }
        }
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.BONUS_DAY_VISION,
        ]
    }
    GetBonusDayVision(): number {
        return this.damage
    }
}

@registerModifier()
export class modifier_path_18_l2 extends modifier_path_18_l1 { }

@registerModifier()
export class modifier_path_18_l3 extends modifier_path_18_l1 { }
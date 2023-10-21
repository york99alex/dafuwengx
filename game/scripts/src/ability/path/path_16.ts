import { GameMessage } from "../../mode/gamemessage";
import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";
import { Player } from "../../player/player";
import { AHMC } from "../../utils/amhc";
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { AbilityManager } from "../abilitymanager";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 路径技能：龙谷
 */
@registerAbility()
export class path_16 extends TSBaseAbility {
    GetIntrinsicModifierName() {
        return "modifier_" + this.GetAbilityName() + "_L" + this.GetLevel()
    }
}

/**
 * 路径技能：龙谷
 */
@registerModifier()
export class modifier_path_16_L1 extends BaseModifier {
    oPlayer: Player
    unUpdateBZBuffByCreate: Function
    tEventID: number[]
    huimo_bz: number
    huimo: number
    shangxian: number
    no_cd_chance: number
    no_mana_chance: number
    spell_amp: number
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
        return "path16"
    }
    OnDestroy(): void {
        if (this.oPlayer) {
            for (const eBZ of this.oPlayer.m_tabBz) {
                if (IsValidEntity(eBZ)) {
                    eBZ.RemoveModifierByName(this.GetName())
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
        this.huimo_bz = ability.GetSpecialValueFor("huimo_bz")
        this.huimo = ability.GetSpecialValueFor("huimo")
        this.shangxian = ability.GetSpecialValueFor("shangxian")
        this.no_cd_chance = ability.GetSpecialValueFor("no_cd_chance")
        this.no_mana_chance = ability.GetSpecialValueFor("no_mana_chance")
        this.spell_amp = ability.GetSpecialValueFor("spell_amp")
        if (IsClient() || !this.GetParent().IsRealHero()) {
            return
        }
        this.oPlayer = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID())
        if (!this.oPlayer) {
            return
        }

        // 给玩家兵卒buff
        Timers.CreateTimer(0.1, () => {
            if (IsValidEntity(this) && IsValidEntity(this.GetAbility())) {
                for (const eBZ of this.oPlayer.m_tabBz) {
                    eBZ.AddNewModifier(this.oPlayer.m_eHero, this.GetAbility(), this.GetName(), {})
                }
                this.unUpdateBZBuffByCreate = AbilityManager.updateBZBuffByCreate(this.oPlayer, this.GetAbility(), (eBZ: CDOTA_BaseNPC_BZ) => {
                    if (IsValidEntity(eBZ)) {
                        const oBuff = eBZ.AddNewModifier(this.oPlayer.m_eHero, this.GetAbility(), this.GetName(), {})
                    }
                })
            }
        })
        this.tEventID = []
        // 提升玩家魔法上限
        this.oPlayer.setMaxMana(this.oPlayer.m_eHero.GetMaxMana() + this.shangxian)
        // 监听玩家回合回魔
        this.tEventID.push(GameRules.EventManager.Register("Event_HeroHuiMoByRound", (event: { oPlayer: Player, nHuiMo: number }) => {
            if (this.oPlayer != event.oPlayer) {
                return
            }
            event.nHuiMo += this.huimo
        }))

        // 监听兵卒回魔事件
        this.tEventID.push(GameRules.EventManager.Register("Event_BZHuiMo",
            (event: {
                eBz: CDOTA_BaseNPC_BZ,
                nHuiMoSum: number,
                getBaseHuiMo: Function
            }) => {
                if (event.eBz.GetPlayerOwnerID() != this.oPlayer.m_nPlayerID) {
                    return
                }
                // 额外回魔
                event.nHuiMoSum += (event.getBaseHuiMo() * this.huimo_bz * 0.01)
            }))

        // 监听技能释放
        this.tEventID.push(GameRules.EventManager.Register("dota_player_used_ability", (event: { caster_entindex: EntityIndex, abilityname: string }) => {
            if (ability.IsNull()) {
                return
            }
            const entity = EntIndexToHScript(event.caster_entindex) as CDOTA_BaseNPC
            if (IsValidEntity(entity) && entity.GetPlayerOwnerID() == this.oPlayer.m_nPlayerID) {
                const oAblt = entity.FindAbilityByName(event.abilityname)
                if (oAblt) {
                    let nPrltName = 0
                    if (RandomInt(1, 100) <= this.no_cd_chance) {
                        // 刷新技能CD
                        if (entity.IsRealHero()) {
                            Timers.CreateTimer(() => {
                                GameRules.EventManager.FireEvent("Event_LastCDChange", {
                                    strAbltName: event.abilityname,
                                    entity: entity,
                                    nCD: 0
                                })
                            })
                        } else {
                            oAblt.EndCooldown
                        }
                        nPrltName += 1
                    }
                    if (RandomInt(1, 100) <= this.no_mana_chance) {
                        // 返回魔法
                        Timers.CreateTimer(() => {
                            entity.GiveMana(oAblt.GetManaCost(oAblt.GetLevel() - 1))
                        })
                        nPrltName += 2
                    }
                    // 特效
                    if (nPrltName != 0) {
                        const nPtclID = AHMC.CreateParticle("particles/custom/path_ablt/path_ablt_nocdmana_" + nPrltName + ".vpcf"
                            , ParticleAttachment.POINT_FOLLOW, false, entity, 3)
                        ParticleManager.SetParticleControl(nPtclID, entity.GetAbsOrigin(), Vector(0, 0, 500))
                        // 音效
                        if (entity.IsRealHero()) {
                            EmitGlobalSound("DOTA_Item.Refresher.Activate")
                        } else {
                            EmitSoundOn("DOTA_Item.Refresher.Activate", entity)
                        }
                    }
                }
            }
        }))
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.SPELL_AMPLIFY_PERCENTAGE
        ]
    }
    GetModifierSpellAmplify_Percentage(event: ModifierAttackEvent): number {
        return this.spell_amp
    }
}

@registerModifier()
export class modifier_path_16_L2 extends BaseModifier {}

@registerModifier()
export class modifier_path_16_L3 extends BaseModifier {}


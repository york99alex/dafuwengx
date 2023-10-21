import { GameMessage } from "../../mode/gamemessage";
import { PathDomain } from "../../path/pathsdomain/pathdomain";
import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";
import { Player } from "../../player/player";
import { AHMC } from "../../utils/amhc";
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { AbilityManager } from "../abilitymanager";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 路径技能：蛇沼
 */
@registerAbility()
export class path_14 extends TSBaseAbility {
    GetIntrinsicModifierName() {
        return "modifier_" + this.GetAbilityName() + "_L" + this.GetLevel()
    }
}

/**
 * 路径技能：蛇沼
 */
@registerModifier()
export class modifier_path_14_L1 extends BaseModifier {
    oPlayer: Player
    sBuffName: string
    unUpdateBZBuffByCreate: Function
    time: number
    chance: number
    tEventID: number[]
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
        return "path14"
    }
    OnDestroy(): void {
        if (this.oPlayer && this.sBuffName) {
            for (const eBZ of this.oPlayer.m_tabBz) {
                if (IsValidEntity(eBZ)) {
                    eBZ.RemoveModifierByName(this.sBuffName)
                }
            }
        }
        if (this.unUpdateBZBuffByCreate) {
            this.unUpdateBZBuffByCreate()
        }
    }
    OnCreated(params: object): void {
        if (!IsValidEntity(this)) {
            return
        }
        if (!IsValidEntity(this.GetAbility())) {
            return
        }
        this.time = this.GetAbility().GetSpecialValueFor("time")
        this.chance = this.GetAbility().GetSpecialValueFor("chance")
        if (IsClient() || !this.GetParent().IsRealHero()) {
            return
        }
        this.oPlayer = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID())
        if (!this.oPlayer) {
            return
        }
        // 给玩家兵卒buff
        function checkBZ(eBZ: CDOTA_BaseNPC_BZ) {
            if (eBZ) {
                if (this.GetAbility().GetLevel() == 3 || eBZ.m_path.m_typePath == GameMessage.TP_DOMAIN_3) {
                    return true
                }
            }
            return false
        }
        Timers.CreateTimer(0.1, () => {
            if (IsValidEntity(this) && IsValidEntity(this.GetAbility())) {
                this.sBuffName = this.GetName()
                for (const eBZ of this.oPlayer.m_tabBz) {
                    if (checkBZ(eBZ))
                        eBZ.AddNewModifier(this.oPlayer.m_eHero, this.GetAbility(), this.GetName(), {})
                }
                this.unUpdateBZBuffByCreate = AbilityManager.updateBZBuffByCreate(this.oPlayer, this.GetAbility(), (eBZ: CDOTA_BaseNPC_BZ) => {
                    if (checkBZ(eBZ) && IsValidEntity(eBZ)) {
                        eBZ.AddNewModifier(this.oPlayer.m_eHero, this.GetAbility(), this.GetName(), {})
                    }
                })
            }
        })

        // 监听玩家路过某路径事件
        this.tEventID.push(GameRules.EventManager.Register("Event_PassingPath", (event: { path: PathDomain, entity: CDOTA_BaseNPC }) => this.onEvent_PassingPath(event), this))
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.BONUS_DAY_VISION,
            ModifierFunction.BONUS_NIGHT_VISION
        ]
    }
    GetBonusDayVision(): number {
        return this.time
    }
    GetBonusNightVision(): number {
        return this.chance
    }

    onEvent_PassingPath(event: { path: PathDomain; entity: CDOTA_BaseNPC; }) {
        const oPlayer = this.oPlayer
        if (!oPlayer || !IsValidEntity(this)) {
            return true
        }
        if (event.entity["bTriggered"]
            || event.path.m_nOwnerID != oPlayer.m_nPlayerID
            || event.entity == oPlayer.m_eHero
            || 0 != bit.band(GameMessage.PS_InPrison, oPlayer.m_nPlayerState)) {
            return
        }
        if (!event.path.m_tabENPC
            || !IsValidEntity(event.path.m_tabENPC[0])
            || !event.path.m_tabENPC[0].FindModifierByName(this.GetName())) {
            return
        }

        // 判断触发
        const oPlayerTarget = GameRules.PlayerManager.getPlayer(event.entity.GetPlayerOwnerID())
        if (oPlayerTarget == null && 0 < bit.band(GameMessage.PS_AbilityImmune, oPlayerTarget.m_nPlayerState)) {
            return
        }
        // 计算缠绕概率
        if (this.chance < RandomInt(1, 100)) {
            return
        }
        // 触发
        event.entity["bTriggered"] = true
        GameRules.EventManager.Register("Event_MoveEnd", (event2) => {
            if (event2.entity == event.entity) {
                event.entity["bTriggered"] = null   // 一次移动阶段只触发一次 
                return true
            }
        })

        // 设置缠绕玩家禁止移动
        oPlayerTarget.setPlayerState(GameMessage.PS_Rooted)

        // 计算缠绕运动
        const nFps = 30
        const nFpsTime = 1 / nFps
        const v3Dis = Vector(0, 0, oPlayerTarget.m_eHero.GetModelRadius() * 2.5)
        const nTimeSum = this.time * 0.5 & nFps
        const v3Speed = v3Dis / nTimeSum
        let v3Cur = oPlayerTarget.m_eHero.GetAbsOrigin()
        let nTimeCur = math.floor(nTimeSum * 0.5)

        const nPtclID = AHMC.CreateParticle("particles/econ/items/windrunner/windrunner_ti6/windrunner_spell_powershot_ti6_arc_b.vpcf"
            , ParticleAttachment.POINT_FOLLOW, false, oPlayerTarget.m_eHero, this.time)
        ParticleManager.SetParticleControlOrientationFLU(nPtclID, 3, Vector(0, 0, 1), Vector(0, 1, 0), Vector(1, 0, 0))

        // 向上缠绕
        EmitSoundOn("Hero_ShadowShaman.Shackles.Cast", oPlayerTarget.m_eHero)
        Timers.CreateTimer(0, () => {
            v3Cur = v3Cur + v3Speed as Vector
            ParticleManager.SetParticleControl(nPtclID, 3, v3Cur)
            nTimeCur -= 1
            if (nTimeCur > 0) {
                return nFpsTime
            }

            // 向下缠绕
            Timers.CreateTimer(nFpsTime, () => {
                v3Cur = v3Cur - v3Speed as Vector
                ParticleManager.SetParticleControl(nPtclID, 3, v3Cur)
                nTimeCur += 1
                if (nTimeCur < nTimeSum) {
                    return nFpsTime
                }
                // 结束
                const nPtclID2 = AHMC.CreateParticle("particles/econ/items/shadow_shaman/shadow_shaman_ti8/shadow_shaman_ti8_ether_shock_target_snakes.vpcf"
                    , ParticleAttachment.CENTER_FOLLOW, false, oPlayerTarget.m_eHero, 2)
                ParticleManager.SetParticleControl(nPtclID2, 0, oPlayerTarget.m_eHero.GetAbsOrigin())
                ParticleManager.SetParticleControl(nPtclID2, 1, oPlayerTarget.m_eHero.GetAbsOrigin() + Vector(0, 0, 10) as Vector)
                EmitSoundOn("Hero_Medusa.MysticSnake.Cast", oPlayerTarget.m_eHero)

                // 设置缠绕玩家禁止移动取消
                oPlayerTarget.setPlayerState(-GameMessage.PS_Rooted)
                return null
            })
        })
    }
}

@registerModifier()
export class modifier_path_14_L2 extends BaseModifier { }

@registerModifier()
export class modifier_path_14_L3 extends BaseModifier { }
import { GS_Move, PS_InPrison, PS_Moving, TP_DOMAIN_6 } from "../../mode/gamemessage";
import { PathDomain } from "../../path/pathsdomain/pathdomain";
import { PathDomain_6 } from "../../path/pathsdomain/pathdomain_6";
import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";
import { Player } from "../../player/player";
import { AHMC, IsValid } from "../../utils/amhc";
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { AbilityManager } from "../abilitymanager";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 路径技能：鵰巢
 */
@registerAbility()
export class path_17 extends TSBaseAbility {
    GetIntrinsicModifierName() {
        print("path==modname:", "modifier_" + this.GetAbilityName() + "_l" + this.GetLevel())
        return "modifier_" + this.GetAbilityName() + "_l" + this.GetLevel()
    }
}

/**
 * 路径技能：鵰巢
 */
@registerModifier()
export class modifier_path_17_l1 extends BaseModifier {
    oPlayer: Player
    unUpdateBZBuffByCreate: number
    tEventID: number[]
    jiansu: number
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
        return "path17"
    }
    RemoveOnDeath(): boolean {
        return false
    }
    DestroyOnExpire(): boolean {
        return false
    }
    OnDestroy(): void {
        print("ability=modifier=OnDestroy===name:", this.GetName())
        if (this.oPlayer) {
            for (const eBZ of this.oPlayer.m_tabBz) {
                if (IsValid(eBZ)) {
                    AHMC.RemoveModifierByName(this.GetName(), eBZ)
                }
            }
        }
        if (this.unUpdateBZBuffByCreate) {
            GameRules.EventManager.UnRegisterByID(this.unUpdateBZBuffByCreate)
        }
        if (this.tEventID) {
            for (const nID of this.tEventID) {
                GameRules.EventManager.UnRegisterByID(nID)
            }
        }
    }
    OnCreated(params: object): void {
        print("ability=modifier=OnCreated===name:", this.GetName(), "Time:", this.GetRemainingTime())
        if (!IsValid(this)) {
            return
        }
        if (!IsValid(this.GetAbility())) {
            return
        }
        const ability = this.GetAbility()
        this.jiansu = ability.GetSpecialValueFor("jiansu")
        this.damage = ability.GetSpecialValueFor("damage")
        print(this.GetName(), "===this.jiansu", this.jiansu)
        print(this.GetName(), "===this.damage", this.damage)
        if (IsClient() || !this.GetParent().IsRealHero()) {
            return
        }
        this.oPlayer = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID())
        if (!this.oPlayer) {
            return
        }

        function checkBZ(eBZ: CDOTA_BaseNPC_BZ) {
            if (eBZ) {
                if (this.GetAbility().GetLevel() == 3 || eBZ.m_path.m_typePath == TP_DOMAIN_6) {
                    return true
                }
            }
            return false
        }
        const oPlayer = this.oPlayer
        const buffName = this.GetName()
        // 给玩家兵卒buff
        Timers.CreateTimer(0.1, () => {
            if (IsValid(this) && IsValid(this.GetAbility())) {
                for (const eBZ of this.oPlayer.m_tabBz) {
                    if (checkBZ(eBZ))
                        eBZ.AddNewModifier(this.oPlayer.m_eHero, this.GetAbility(), this.GetName(), {})
                }
                this.unUpdateBZBuffByCreate = AbilityManager.updateBZBuffByCreate(this.oPlayer, this.GetAbility(), (eBZ: CDOTA_BaseNPC_BZ) => {
                    if (checkBZ(eBZ) && IsValid(eBZ)) {
                        eBZ.AddNewModifier(oPlayer.m_eHero, ability, buffName, {})
                    }
                })
            }
        })

        this.tEventID = []

        const tabPath = GameRules.PathManager.getPathByType(TP_DOMAIN_6) as PathDomain_6[]
        const pathMid = tabPath[1]
        const eDiao = pathMid.m_eDiao
        if (!eDiao) {
            return
        }

        // 监听敌人移动
        const tabMover: CDOTA_BaseNPC[] = []
        // 伤害检测
        const sDamageCD = "_onAblt_path_17_DamageCD" + ability.GetEntityIndex()
        const sHasBuff = "_onAblt_path_17_HasBuff" + ability.GetEntityIndex()

        function funOnDamage(v3: Vector, nID: number) {
            if (!IsValid(ability)) {
                return
            }
            for (const v of tabMover) {
                if (IsValid(v)) {
                    const nDis = (v.GetAbsOrigin() - v3 as Vector).Length2D()
                    if (nDis > 200) {
                        if (sHasBuff && v[sHasBuff + nID]) {
                            // 脱离范围删除减速buff
                            v[sHasBuff + nID] = false
                            AHMC.RemoveModifierByNameAndCaster(modifier_path_17_debuff.name, v, this.oPlayer.m_eHero)
                        }
                        return
                    }
                    if (!v[sDamageCD + nID]) {
                        v[sDamageCD + nID] = true
                        AHMC.Damage(this.oPlayer.m_eHero, v, this.damage, ability.GetAbilityDamageType(), this)
                        Timers.CreateTimer(0.5, () => {
                            v[sDamageCD + nID] = false
                        })
                    }
                    if (!v[sHasBuff + nID]) {
                        v[sHasBuff + nID] = true
                        v.AddNewModifier(this.oPlayer.m_eHero, ability, modifier_path_17_debuff.name, {})
                    }
                }
            }
        }

        function funOnMove(event: { entity: CDOTA_BaseNPC_Hero }) {
            if (event.entity == this.oPlayer.m_eHero) {
                return
            }
            if (!IsValid(ability)) {
                return true
            }
            if (0 < bit.band(PS_InPrison, this.oPlayer.m_nPlayerState)) {
                return
            }

            // 添加移动中的实体
            tabMover.push(event.entity)

            // 获取要生成飓风的路径区域
            const tPaths: PathDomain[][] = [[]]
            for (const path of GameRules.PathManager.m_tabPaths) {
                if (path instanceof PathDomain
                    && path.m_nOwnerID == this.oPlayer.m_nPlayerID
                    && path.m_tabENPC[0] && checkBZ(path.m_tabENPC[0])) {
                    const tab = tPaths[tPaths.length - 1]
                    if (tab[tab.length - 1] && tab[tab.length - 1].m_nID + 1 != path.m_nID) {
                        tPaths.push([])
                    }
                    tPaths[tPaths.length - 1].push(path)
                    if (GameRules.PathManager.m_tabPaths.length == path.m_nID && tPaths[0][0] && tPaths[0][0].m_nID == 1) {
                        // 首尾相连
                        tPaths[0].concat(tPaths[tPaths.length - 1])
                        tPaths.splice(tPaths.length - 1, 1)
                    }
                }
            }

            // 创建飓风
            for (const tab of tPaths) {
                const nPtclID = AHMC.CreateParticle("particles/neutral_fx/tornado_ambient.vpcf"
                    , ParticleAttachment.POINT, false, eDiao)
                // 刮风在路径上做往复移动
                const tabPathMove = [tab[0]]
                if (tab.length > 1) {
                    tabPathMove.push(tab[tab.length - 1])
                }
                let pathCur = tabPathMove[0]

                function getNextPath() {
                    for (let i = tabPathMove.length - 1; i >= 0; i--) {
                        if (tabPathMove[i] == pathCur) {
                            if (i < tabPathMove.length && tabPathMove[i + 1]) {
                                return tabPathMove[i + 1]
                            }
                            if (tabPathMove[0]) {
                                return tabPathMove[0]
                            }
                        }
                    }
                    return pathCur
                }


                // 持续移动飓风
                function funMoveFeng(modi: modifier_path_17_l1) {
                    const pathNext = getNextPath()
                    const nFps = 30
                    const nFpsTime = 1 / nFps
                    const v3Dis = pathNext.m_entity.GetAbsOrigin() - pathCur.m_entity.GetAbsOrigin()
                    const nTimeSum = 2 * nFps
                    const v3Speed = v3Dis / nTimeSum
                    let v3Cur = pathCur.m_entity.GetAbsOrigin()
                    let nTimeCur = math.floor(nTimeSum)

                    Timers.CreateTimer(() => {
                        if (tabMover.length > 0 && IsValid(ability)) {
                            v3Cur = v3Cur + v3Speed as Vector
                            ParticleManager.SetParticleControl(nPtclID, 0, v3Cur)
                            // 触发伤害和减速
                            funOnDamage(v3Cur, nPtclID)
                            pathMid.setDiaoGesture(GameActivity.DOTA_CAST_ABILITY_1)
                            nTimeCur -= 1
                            if (nTimeCur > 0) {
                                return nFpsTime
                            }
                            pathCur = pathNext
                            funMoveFeng(modi)
                        } else {
                            if (IsValid(event.entity)) {
                                AHMC.RemoveModifierByNameAndCaster(modifier_path_17_debuff.name, event.entity, modi.oPlayer.m_eHero)
                            }
                            ParticleManager.DestroyParticle(nPtclID, false)
                            pathMid.setDiaoGesture(-GameActivity.DOTA_CAST_ABILITY_1)

                            // 初始化伤害检测变量
                            event.entity[sDamageCD + nPtclID] = false
                            event.entity[sHasBuff + nPtclID] = false
                        }
                    })
                }

                funMoveFeng(this)
            }
        }

        if (GameRules.GameConfig.m_typeState == GS_Move) {
            // 当前已经在移动阶段，手动调用
            for (const v of GameRules.PlayerManager.m_tabPlayers) {
                if (0 < bit.band(PS_Moving, v.m_nPlayerState)) {
                    funOnMove({ entity: v.m_eHero })
                }
            }
        }
        this.tEventID.push(GameRules.EventManager.Register("Event_Move", (event: { entity: CDOTA_BaseNPC_Hero }) => funOnMove(event)))
        this.tEventID.push(GameRules.EventManager.Register("Event_MoveEnd", (event: { entity: CDOTA_BaseNPC_Hero }) => {
            if (ability == null || ability.IsNull()) {
                return true
            }
            for (const v of tabMover) {
                if (v == event.entity) {
                    tabMover.splice(tabMover.indexOf(v), 1)
                    break
                }

            }
        }))
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.BONUS_DAY_VISION,
            ModifierFunction.BONUS_NIGHT_VISION
        ]
    }
    GetBonusDayVision(): number {
        return this.damage
    }
    GetBonusNightVision(): number {
        return this.jiansu
    }
}

@registerModifier()
export class modifier_path_17_l2 extends modifier_path_17_l1 { }

@registerModifier()
export class modifier_path_17_l3 extends modifier_path_17_l1 { }

@registerModifier()
export class modifier_path_17_debuff extends BaseModifier {
    jiansu: number
    IsHidden(): boolean {
        return false
    }
    IsDebuff(): boolean {
        return true
    }
    IsPurgable(): boolean {
        return false
    }
    GetTexture(): string {
        return "path17"
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.MOVESPEED_BONUS_PERCENTAGE
        ]
    }
    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.jiansu
    }
    OnCreated(params: object): void {
        print("path===OnCreated")
        this.jiansu = this.GetAbility().GetSpecialValueFor("jiansu")
    }
}
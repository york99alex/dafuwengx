import { GameMessage } from "../mode/gamemessage"

export interface TSBaseAbility extends CDOTA_Ability_Lua { }
export class TSBaseAbility {

    m_strCastError: string = null
    m_tBaseManaCost: number[] = null
    m_tBaseCooldown: number[] = null
    m_bInit: boolean = null

    constructor() {
        this.m_bInit = true
        this.m_tBaseManaCost = []
        this.m_tBaseCooldown = []

        let tAbility
        if (IsServer()) {
            tAbility = this.GetAbilityKeyValues()
        } else {
            return
        }
        if (tAbility) {
            if (tAbility["AbilityManaCost"]) {
                const tab: string[] = (tAbility["AbilityManaCost"] as string).split(" ")
                for (const str of tab) {
                    this.m_tBaseManaCost.push(tonumber(str))
                }
            }
            if (tAbility["AbilityCooldown"]) {
                const tab: string[] = (tAbility["AbilityCooldown"] as string).split(" ")
                for (const str of tab) {
                    this.m_tBaseCooldown.push(tonumber(str))
                }
            }
        }
        print("===TSBaseAbility.constructor===")
        DeepPrintTable(this.m_tBaseManaCost)
        DeepPrintTable(this.m_tBaseCooldown)
    }

    /**当技能升级时 */
    OnUpgrade() {
        if (!this.m_bInit) {
            this.constructor()
        }
    }

    /**定义技能释放之后的冷却时间 */
    GetCooldown(nLevel: number): number {
        if (!this.m_bInit) {
            this.constructor()
        }

        // 获取冷却缩减
        let nCDSub = 0
        if (this.isCanCDSub()) {
            const keyname = "player_info_" + this.GetCaster().GetPlayerOwnerID() as
                "player_info_0" | "player_info_1" | "player_info_2" | "player_info_3" | "player_info_4" | "player_info_5";
            const tabPlayerInfo = CustomNetTables.GetTableValue("GamingTable", keyname)
            if (tabPlayerInfo && tabPlayerInfo.nCDSub) {
                nCDSub = tabPlayerInfo.nCDSub
            }
        }

        // 计算技能等级索引
        if (nLevel == -1) {
            nLevel = this.GetLevel()
        } else {
            nLevel = 1 + nLevel
        }

        if (this.m_tBaseCooldown) {
            if (nLevel > this.m_tBaseCooldown.length) {
                nLevel = this.m_tBaseCooldown.length
            }
            if (this.m_tBaseCooldown[nLevel - 1] && nCDSub < this.m_tBaseCooldown[nLevel - 1]) {
                return this.m_tBaseCooldown[nLevel - 1] - nCDSub
            }
        }
        return 0
    }

    /**返回技能等级的魔法消耗 */
    GetManaCost(nLevel: number): number {
        if (!this.m_bInit) {
            this.constructor()
        }

        // 获取冷却缩减
        let nManaSub = 0
        if (this.isCanManaSub()) {
            const keyname = "player_info_" + this.GetCaster().GetPlayerOwnerID() as
                "player_info_0" | "player_info_1" | "player_info_2" | "player_info_3" | "player_info_4" | "player_info_5";
            const tabPlayerInfo = CustomNetTables.GetTableValue("GamingTable", keyname)
            if (tabPlayerInfo && tabPlayerInfo.nManaSub) {
                nManaSub = tabPlayerInfo.nManaSub
            }
        }

        // 计算技能等级索引
        if (nLevel == -1) {
            nLevel = this.GetLevel()
        } else {
            nLevel = 1 + nLevel
        }

        if (this.m_tBaseManaCost) {
            if (nLevel > this.m_tBaseManaCost.length) {
                nLevel = this.m_tBaseManaCost.length
            }
            if (this.m_tBaseManaCost[nLevel - 1] && nManaSub < this.m_tBaseManaCost[nLevel - 1]) {
                return this.m_tBaseManaCost[nLevel - 1] - nManaSub
            }
        }
        return 0
    }

    /**是否计算冷却减缩 */
    isCanCDSub() {
        return true
    }

    /**是否计算耗魔减缩 */
    isCanManaSub() {
        return true
    }

    /**
     * 通用判断技能施法
     */
    isCanCast(eTarget?: CDOTA_BaseNPC): boolean {
        if (GameRules.GameConfig != null) {

            // 非自己阶段不能施法
            if (!this.isCanCastOtherRound() && this.GetCaster().GetPlayerOwnerID() != GameRules.GameConfig.m_nOrderID) {
                this.m_strCastError = "AbilityError_SelfRound"
                return false
            }
            // 移动阶段不能施法
            if (!this.isCanCastMove() && GameRules.GameConfig.m_typeState == GameMessage.GS_Move) {
                this.m_strCastError = "AbilityError_Move"
                return false
            }
            // 补给阶段不能施法
            if (!this.isCanCastSupply() && GameRules.GameConfig.m_typeState == GameMessage.GS_Supply) {
                this.m_strCastError = "AbilityError_Supply"
                return false
            }
            // 亡国阶段不能施法
            if (GameRules.GameConfig.m_typeState == GameMessage.GS_DeathClearing) {
                this.m_strCastError = "AbilityError_DeathClearing"
                return false
            }
            // 等待阶段不能施法
            if (GameRules.GameConfig.m_typeState == GameMessage.GS_Wait) {
                this.m_strCastError = "AbilityError_Wait"
                return false
            }

            // 验证施法玩家
            const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID())
            if (oPlayer != null) {
                // 在监狱不能施法
                if (!this.isCanCastInPrison() && (GameMessage.PS_InPrison & oPlayer.m_nPlayerState) > 0) {
                    this.m_strCastError = "AbilityError_InPrison"
                    return false
                }
                // 在英雄攻击时不能施法
                if (!this.isCanCastHeroAtk() && (GameMessage.PS_AtkHero & oPlayer.m_nPlayerState) > 0) {
                    this.m_strCastError = "AbilityError_Battle"
                    return false
                }
            }

            if (!this.isCanCastAtk() && oPlayer.m_bBattle) {
                this.m_strCastError = "AbilityError_Battle"
                return false
            }

            // 验证目标单位
            if (eTarget && this.checkTarget(eTarget)) {
                return false
            }
        }
        return true
    }

    // 判断目标
    checkTarget(eTarget: CDOTA_BaseNPC): boolean {
        if (!eTarget && eTarget.IsNull()) {
            return false
        }

        this.m_strCastError = "ERROR"

        // 对自己释放
        if (eTarget == this.GetCaster() && !this.isCanCastSelf()) {
            this.m_strCastError = "AbilityError_SelfCant"
            return false
        }

        const oPlayer = GameRules.PlayerManager.getPlayer(eTarget.GetPlayerOwnerID())
        if (oPlayer) {
            // 目标死亡
            if ((oPlayer.m_nPlayerState & GameMessage.PS_Die) > 0) {
                return false
            }
            // 目标在监狱
            if ((oPlayer.m_nPlayerState & GameMessage.PS_InPrison) > 0) {
                this.m_strCastError = "AbilityError_InPrison"
                return false
            }
        }

        // 目标是英雄
        if (eTarget.IsHero()) {
            if (eTarget.IsIllusion() && !this.isCanCastIllusion()) {
                // 不能是幻象
                this.m_strCastError = "AbilityError_IllusionsCant"
            } else if (this.isCanCastHero()) {
                // 不能是英雄
                this.m_strCastError = "AbilityError_HeroCant"
            }
        } else if ((eTarget as any).m_bBZ) {
            // 兵卒
            if (!this.isCanCastBZ()) {
                this.m_strCastError = "AbilityError_BZCant"
            }
        } else if ((eTarget as any).m_bMonster) {
            // 野怪
            if (!this.isCanCastMonster()) {
                // 需要玩家控制，不能是野怪
                this.m_strCastError = "AbilityError_MonsterCant"
            }
        } else {
            return false
        }

        if (this.m_strCastError != "ERROR") {
            return false
        }
        return true
    }

    // 能否在其他玩家回合时释放
    isCanCastOtherRound() {
        return false
    }

    // 能否在移动时释放
    isCanCastMove() {
        return false
    }

    // 能否在监狱时释放
    isCanCastInPrison() {
        return false
    }

    // 能否在轮抽时释放
    isCanCastSupply() {
        return false
    }

    // 能否在英雄攻击时释放
    isCanCastHeroAtk() {
        return false
    }

    // 能否在该单位攻击时释放
    isCanCastAtk() {
        return false
    }

    // 能否对自身释放
    isCanCastSelf() {
        return false
    }

    // 能否对幻象释放
    isCanCastIllusion() {
        return 0 == bit.band(UnitTargetFlags.NOT_ILLUSIONS, this.GetAbilityTargetFlags())
    }

    // 能否对兵卒释放
    isCanCastBZ() {
        return 0 < bit.band(UnitTargetType.BASIC, this.GetAbilityTargetType())
    }

    // 能否对英雄释放
    isCanCastHero() {
        return 0 < bit.band(UnitTargetType.HERO, this.GetAbilityTargetType())
    }

    // 能否对野怪释放
    isCanCastMonster() {
        return 0 == bit.band(UnitTargetFlags.PLAYER_CONTROLLED, this.GetAbilityTargetFlags())
    }
}
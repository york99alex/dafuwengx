import { GS_Move, GS_Supply, GS_DeathClearing, GS_Wait, PS_InPrison, PS_AtkHero, PS_Die } from "../mode/gamemessage";
import { Path } from "../path/Path";
import { BaseItem } from "../utils/dota_ts_adapter";

export class TSBaseItem extends BaseItem {
    /**施法错误信息 */
    m_strCastError: string
    /**初始化 */
    m_bInit: boolean
    // 施法基础耗蓝
    m_tBaseManaCost: number[]
    // 施法基础冷却
    m_tBaseCooldown: number[]
    // 选择目标地点
    m_vPosTarget?: Vector
    // 选择目标路径
    m_pathTarget?: Path
    /**技能标识时间 */
    timeAbltMark?: number
    // 技能标识特效
    tabAbltMarkPtcl?: ParticleID[]
    // 前摇/持续施法进行等待状态标识可以进行
    yieldWait?: boolean

    constructor() {
        super()
        // if(this.m_bInit){
        //     return
        // }
        // this.m_bInit = true
    }
    GetCustomCastError(): string {
        return this.m_strCastError
    }
    GetCustomCastErrorTarget(target: CDOTA_BaseNPC): string {
        return this.m_strCastError
    }
    GetCustomCastErrorLocation(location: Vector): string {
        return this.m_strCastError
    }

    /**
     * 通用判断技能施法
     */
    isCanCast(eTarget?: CDOTA_BaseNPC): boolean {
        if (GameRules.GameConfig != null) {

            // 准备阶段不能施法
            if (GameRules.GameConfig.m_nRound == 0) {
                this.m_strCastError = "AbilityError_Round0"
                return false
            }

            // 非自己阶段不能施法
            if (!this.isCanCastOtherRound() && this.GetCaster().GetPlayerOwnerID() != GameRules.GameConfig.m_nOrderID) {
                this.m_strCastError = "AbilityError_NotSelfRound"
                return false
            }
            // 移动阶段不能施法
            if (!this.isCanCastMove() && GameRules.GameConfig.m_typeState == GS_Move) {
                this.m_strCastError = "AbilityError_Move"
                return false
            }
            // 补给阶段不能施法
            if (!this.isCanCastSupply() && GameRules.GameConfig.m_typeState == GS_Supply) {
                this.m_strCastError = "AbilityError_Supply"
                return false
            }
            // 亡国阶段不能施法
            if (GameRules.GameConfig.m_typeState == GS_DeathClearing) {
                this.m_strCastError = "AbilityError_DeathClearing"
                return false
            }
            // 等待阶段不能施法
            if (GameRules.GameConfig.m_typeState == GS_Wait && !this.yieldWait) {
                this.m_strCastError = "AbilityError_Wait"
                return false
            }

            // 验证施法玩家
            const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID())
            if (oPlayer != null) {
                // 在监狱不能施法
                if (!this.isCanCastInPrison() && (PS_InPrison & oPlayer.m_nPlayerState) > 0) {
                    this.m_strCastError = "AbilityError_InPrison"
                    return false
                }
                // 在英雄攻击时不能施法
                if (!this.isCanCastHeroAtk() && (PS_AtkHero & oPlayer.m_nPlayerState) > 0) {
                    this.m_strCastError = "AbilityError_Battle"
                    return false
                }
            }

            if (!this.isCanCastAtk() && oPlayer.m_bGCLD) {
                this.m_strCastError = "AbilityError_Battle"
                return false
            }

            // 验证目标单位
            if (eTarget && !this.checkTarget(eTarget)) {
                return false
            }
        }
        return true
    }

    // 判断目标
    checkTarget(eTarget: CDOTA_BaseNPC): boolean {
        print("checkTarget===1")
        if (!eTarget && eTarget.IsNull()) {
            return false
        }
        print("checkTarget===2")

        this.m_strCastError = "ERROR"

        // 对自己释放
        if (eTarget == this.GetCaster() && !this.isCanCastSelf()) {
            this.m_strCastError = "AbilityError_SelfCant"
            print("checkTarget===3")
            return false
        }

        const oPlayer = GameRules.PlayerManager.getPlayer(eTarget.GetPlayerOwnerID())
        if (oPlayer) {
            // 目标死亡
            if ((oPlayer.m_nPlayerState & PS_Die) > 0) {
                print("checkTarget===4")
                return false
            }
            // 目标在监狱
            if ((oPlayer.m_nPlayerState & PS_InPrison) > 0) {
                this.m_strCastError = "AbilityError_InPrison"
                print("checkTarget===5")
                return false
            }
        }

        // 目标是英雄
        if (eTarget.IsHero()) {
            if (eTarget.IsIllusion() && !this.isCanCastIllusion()) {
                // 不能是幻象
                this.m_strCastError = "AbilityError_IllusionsCant"
            } else if (!this.isCanCastHero()) {
                // 不能是英雄
                this.m_strCastError = "AbilityError_HeroCant"
            }
        } else if (!eTarget.IsRealHero()) {
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
            print("checkTarget===6")
            return false
        }

        if (this.m_strCastError != "ERROR") {
            print("checkTarget===7 , this.m_strCastError:", this.m_strCastError)
            return false
        }
        print("checkTarget===success")
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
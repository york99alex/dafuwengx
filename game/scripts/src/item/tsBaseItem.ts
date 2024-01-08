import { GS_Move, GS_Supply, GS_DeathClearing, GS_Wait, PS_InPrison, PS_AtkHero, PS_Die } from '../constants/gamemessage';
import { Path } from '../path/path';
import { player_info } from '../player/player';
import { BaseItem } from '../utils/dota_ts_adapter';

export class TSBaseItem extends BaseItem {
    /**施法错误信息 */
    m_strCastError: string;
    /**初始化 */
    m_bInit: boolean;
    // 施法基础耗蓝
    m_tBaseManaCost: number[];
    // 施法基础冷却
    m_tBaseCooldown: number[];
    // 选择目标地点
    m_vPosTarget?: Vector;
    // 选择目标路径
    m_pathTarget?: Path;
    /**技能标识时间 */
    timeAbltMark?: number;
    // 技能标识特效
    tabAbltMarkPtcl?: ParticleID[];
    // 前摇/持续施法进行等待状态标识可以进行
    yieldWait?: boolean;

    constructor() {
        super();
        // if(this.m_bInit){
        //     return
        // }
        // this.m_bInit = true
    }
    GetCustomCastError(): string {
        print('GetCustomCastError');
        return this.m_strCastError;
    }
    GetCustomCastErrorTarget(target: CDOTA_BaseNPC): string {
        print('GetCustomCastErrorTarget');
        return this.m_strCastError;
    }
    GetCustomCastErrorLocation(location: Vector): string {
        print('GetCustomCastErrorLocation');
        return this.m_strCastError;
    }

    // GetCooldown(level: number): number {
    //     let nCD = super.GetCooldown(level);

    //     // 获取冷却缩减
    //     let nCDSub = 0;
    //     if (this.isCanCDSub()) {
    //         const keyname = ('player_info_' + this.GetCaster().GetPlayerOwnerID()) as player_info;
    //         const tabPlayerInfo = CustomNetTables.GetTableValue('GamingTable', keyname);
    //         if (tabPlayerInfo && tabPlayerInfo.nCDSub) {
    //             nCDSub = tabPlayerInfo.nCDSub;
    //         }
    //     }
    //     return nCD - nCDSub;
    // }

    /**
     * 通用判断装备技能施法
     */
    isCanCast(eTarget?: CDOTA_BaseNPC): boolean {
        print('isCanCast===0===isserver:', IsServer(), 'isclient:', IsClient());
        if (GameRules.GameConfig != null) {
            // print('isCanCast===1');
            // 准备阶段不能施法
            if (GameRules.GameConfig.m_nRound == 0) {
                this.m_strCastError = 'AbilityError_Round0';
                return false;
            }
            // print('isCanCast===2');
            // 非自己阶段不能施法
            if (!this.isCanCastOtherRound() && this.GetCaster().GetPlayerOwnerID() != GameRules.GameConfig.m_nOrderID) {
                this.m_strCastError = 'AbilityError_NotSelfRound';
                return false;
            }
            if (!this.GetCaster().IsRealHero() && this.isBZCanCast()) {
                this.m_strCastError = 'AbilityError_BZCantCast';
                return false;
            }
            // print('isCanCast===3');
            // 移动阶段不能施法
            if (!this.isCanCastMove() && GameRules.GameConfig.m_typeState == GS_Move) {
                this.m_strCastError = 'AbilityError_Move';
                return false;
            }
            // print('isCanCast===4');
            // 补给阶段不能施法
            if (!this.isCanCastSupply() && GameRules.GameConfig.m_typeState == GS_Supply) {
                this.m_strCastError = 'AbilityError_Supply';
                return false;
            }
            // print('isCanCast===5');
            // 死亡清算阶段不能施法
            if (GameRules.GameConfig.m_typeState == GS_DeathClearing) {
                this.m_strCastError = 'AbilityError_DeathClearing';
                return false;
            }
            // print('isCanCast===6');
            // 等待阶段不能施法
            if (GameRules.GameConfig.m_typeState == GS_Wait && !this.yieldWait) {
                this.m_strCastError = 'AbilityError_Wait';
                return false;
            }

            // print('isCanCast===7');
            // 验证施法玩家
            const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
            if (oPlayer != null) {
                // 在监狱不能施法
                if (!this.isCanCastInPrison() && (PS_InPrison & oPlayer.m_nPlayerState) > 0) {
                    this.m_strCastError = 'AbilityError_InPrison';
                    return false;
                }
                // print('isCanCast===8');
                // 在英雄攻击时不能施法
                if (!this.isCanCastHeroAtk() && (PS_AtkHero & oPlayer.m_nPlayerState) > 0) {
                    this.m_strCastError = 'AbilityError_Battle';
                    return false;
                }
            }

            // print('isCanCast===9');
            if (!this.isCanCastAtk() && oPlayer.m_bGCLD) {
                this.m_strCastError = 'AbilityError_Battle';
                return false;
            }

            // print('isCanCast===10');
            // 验证目标单位
            if (eTarget && !this.checkTarget(eTarget)) {
                // this.m_strCastError = 'AbilityError_Target';
                return false;
            }
            // print('isCanCast===11');
            return true;
        }
    }

    // 判断目标
    checkTarget(eTarget: CDOTA_BaseNPC): boolean {
        print('checkTarget===1');
        if (!eTarget && eTarget.IsNull()) {
            return false;
        }
        print('checkTarget===2');

        this.m_strCastError = 'ERROR';

        // 对自己释放
        if (eTarget == this.GetCaster() && !this.isCanCastSelf()) {
            this.m_strCastError = 'AbilityError_SelfCant';
            print('checkTarget===3');
            return false;
        }

        const oPlayer = GameRules.PlayerManager.getPlayer(eTarget.GetPlayerOwnerID());
        if (oPlayer) {
            // 目标死亡
            if ((oPlayer.m_nPlayerState & PS_Die) > 0) {
                print('checkTarget===4');
                return false;
            }
            // 目标在监狱
            if ((oPlayer.m_nPlayerState & PS_InPrison) > 0) {
                this.m_strCastError = 'AbilityError_InPrison';
                print('checkTarget===5');
                return false;
            }
        }

        // 目标是英雄
        if (eTarget.IsHero()) {
            if (eTarget.IsIllusion() && !this.isCanCastIllusion()) {
                // 不能是幻象
                this.m_strCastError = 'AbilityError_IllusionsCant';
            } else if (!this.isCanCastHero()) {
                // 不能是英雄
                this.m_strCastError = 'AbilityError_HeroCant';
            }
        } else if (!eTarget.IsRealHero()) {
            // 兵卒
            if (!this.isCanCastBZ()) {
                this.m_strCastError = 'AbilityError_BZCant';
            }
        } else if ((eTarget as any).m_bMonster) {
            // 野怪
            if (!this.isCanCastMonster()) {
                // 需要玩家控制，不能是野怪
                this.m_strCastError = 'AbilityError_MonsterCant';
            }
        } else {
            print('checkTarget===6');
            return false;
        }

        if (this.m_strCastError != 'ERROR') {
            print('checkTarget===7 , this.m_strCastError:', this.m_strCastError);
            return false;
        }
        print('checkTarget===success');
        return true;
    }

    // 能否在其他玩家回合时释放
    isCanCastOtherRound() {
        return false;
    }

    // 能否在移动时释放
    isCanCastMove() {
        return false;
    }

    // 能否在监狱时释放
    isCanCastInPrison() {
        return false;
    }

    // 能否在轮抽时释放
    isCanCastSupply() {
        return false;
    }

    // 能否在英雄攻击时释放
    isCanCastHeroAtk() {
        return false;
    }

    // 能否在该单位攻击时释放
    isCanCastAtk() {
        return false;
    }

    // 能否对自身释放
    isCanCastSelf() {
        return false;
    }

    // 能否对幻象释放
    isCanCastIllusion() {
        return 0 == bit.band(UnitTargetFlags.NOT_ILLUSIONS, this.GetAbilityTargetFlags());
    }

    // 能否对兵卒释放
    isCanCastBZ() {
        return 0 < bit.band(UnitTargetType.BASIC, this.GetAbilityTargetType());
    }

    // 能否对英雄释放
    isCanCastHero() {
        return 0 < bit.band(UnitTargetType.HERO, this.GetAbilityTargetType());
    }

    // 能否对野怪释放
    isCanCastMonster() {
        return 0 == bit.band(UnitTargetFlags.PLAYER_CONTROLLED, this.GetAbilityTargetFlags());
    }

    isCanCDSub() {
        return true;
    }

    /**兵卒能否施法 */
    isBZCanCast() {
        return false;
    }
}

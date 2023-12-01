import { KeyValues } from '../kv';
import { GS_DeathClearing, GS_Move, GS_Supply, GS_Wait, PS_AtkHero, PS_Die, PS_InPrison } from '../mode/gamemessage';
import { Path } from '../path/Path';
import { PathManager } from '../path/PathManager';
import { CDOTA_BaseNPC_BZ } from '../player/CDOTA_BaseNPC_BZ';
import { player_info } from '../player/player';
import { IsValid } from '../utils/amhc';
import { BaseAbility } from '../utils/dota_ts_adapter';
import { AbilityManager } from './abilitymanager';

export class TSBaseAbility extends BaseAbility {
    // 施法错误信息
    m_strCastError: string;
    // 施法基础耗蓝
    m_tBaseManaCost: number[];
    // 施法基础冷却
    m_tBaseCooldown: number[];
    // 是否初始化(升级等情况也会初始化)
    m_bInit: boolean = null;
    // 选择目标地点
    m_vPosTarget?: Vector;
    // 选择目标路径
    m_pathTarget?: Path;
    // 技能标识时间
    timeAbltMark?: number;
    // 技能标识特效
    tabAbltMarkPtcl?: ParticleID[];
    // 前摇/持续施法进行等待状态标识可以进行
    yieldWait?: boolean;

    constructor() {
        super();
        this.m_bInit = true;
        this.m_tBaseManaCost = [];
        this.m_tBaseCooldown = [];

        let tAbility;
        if (IsClient()) {
            tAbility = KeyValues.AbilitiesKV[this.GetName()];
        } else {
            tAbility = KeyValues.AbilitiesKV[this.GetAbilityName()];
        }
        if (tAbility) {
            if (tAbility['AbilityManaCost']) {
                const tab: string[] = (tAbility['AbilityManaCost'] as string).split(' ');
                for (const str of tab) {
                    this.m_tBaseManaCost.push(tonumber(str));
                }
            }
            if (tAbility['AbilityCooldown']) {
                const tab: string[] = (tAbility['AbilityCooldown'] as string).split(' ');
                for (const str of tab) {
                    this.m_tBaseCooldown.push(tonumber(str));
                }
            }
        }
    }

    /**
     * 自定义目标单位错误
     * @param target 目标单位
     * @returns 本地化键值
     */
    GetCustomCastErrorTarget(target: CDOTA_BaseNPC): string {
        return this.m_strCastError;
    }

    /**
     * 自定义目标地点错误
     * @param location 目标地点vector
     * @returns 本地化键值
     */
    GetCustomCastErrorLocation(location: Vector): string {
        return this.m_strCastError;
    }

    /**
     * 自定义无目标错误
     * @returns 本地化键值
     */
    GetCustomCastError(): string {
        return this.m_strCastError;
    }

    /**当开始施法的时候，资源尚未被消耗 */
    OnAbilityPhaseStart(): boolean {
        return true;
    }

    /**当技能升级时 */
    OnUpgrade() {
        if (!this.m_bInit) {
            this.constructor();
        }
    }

    /**定义技能释放之后的冷却时间 */
    GetCooldown(nLevel: number): number {
        if (!this.m_bInit && IsClient()) {
            this.constructor();
        }

        // 获取冷却缩减
        let nCDSub = 0;
        if (this.isCanCDSub()) {
            const keyname = ('player_info_' + this.GetCaster().GetPlayerOwnerID()) as player_info;
            const tabPlayerInfo = CustomNetTables.GetTableValue('GamingTable', keyname);
            if (tabPlayerInfo && tabPlayerInfo.nCDSub) {
                nCDSub = tabPlayerInfo.nCDSub;
            }
        }

        // 计算技能等级索引
        if (nLevel == -1) {
            nLevel = this.GetLevel();
        } else {
            nLevel = 1 + nLevel;
        }

        if (this.m_tBaseCooldown) {
            if (nLevel > this.m_tBaseCooldown.length) {
                nLevel = this.m_tBaseCooldown.length;
            }
            if (this.m_tBaseCooldown[nLevel - 1] && nCDSub < this.m_tBaseCooldown[nLevel - 1]) {
                return this.m_tBaseCooldown[nLevel - 1] - nCDSub;
            }
        }
        return 0;
    }

    /**
     * 定义技能的施法距离
     * @param location
     * @param target
     */
    GetCastRange(location: Vector, target: CDOTA_BaseNPC | undefined): number {
        let nRange = this.GetSpecialValueFor('range');
        if (!nRange || nRange < 0) {
            nRange = 0;
        }
        const keyname = ('player_info_' + this.GetCaster().GetPlayerOwnerID()) as player_info;
        const tabPlayerInfo = CustomNetTables.GetTableValue('GamingTable', keyname);
        if (!tabPlayerInfo) {
            return;
        }

        const nOffset = this.GetSpecialValueFor('offset');
        let tabPathID = [];
        let nPathID = PathManager.getNextPathID(tabPlayerInfo.nPathCurID, -math.floor((nRange - 1) * 0.5) + nOffset);
        for (let i = 0; i < nRange; i++) {
            tabPathID.push(nPathID);
            nPathID = PathManager.getNextPathID(nPathID, 1);
        }
        AbilityManager.showAbltMark(this, this.GetCaster(), tabPathID);
        return 0;
    }

    /**返回技能等级的魔法消耗 */
    GetManaCost(nLevel: number): number {
        if (!this.m_bInit && IsClient()) {
            this.m_bInit = true;
            return;
        }

        // 获取冷却缩减
        let nManaSub = 0;
        if (this.isCanManaSub()) {
            const keyname = ('player_info_' + this.GetCaster().GetPlayerOwnerID()) as player_info;
            const tabPlayerInfo = CustomNetTables.GetTableValue('GamingTable', keyname);
            if (tabPlayerInfo && tabPlayerInfo.nManaSub) {
                nManaSub = tabPlayerInfo.nManaSub;
            }
        }

        // 计算技能等级索引
        if (nLevel == -1) {
            nLevel = this.GetLevel();
        } else {
            nLevel = 1 + nLevel;
        }

        if (this.m_tBaseManaCost) {
            if (nLevel > this.m_tBaseManaCost.length) {
                nLevel = this.m_tBaseManaCost.length;
            }
            if (this.m_tBaseManaCost[nLevel - 1] && nManaSub < this.m_tBaseManaCost[nLevel - 1]) {
                return this.m_tBaseManaCost[nLevel - 1] - nManaSub;
            }
        }
        return 0;
    }

    /**是否计算冷却减缩 */
    isCanCDSub() {
        return true;
    }

    /**是否计算耗魔减缩 */
    isCanManaSub() {
        return true;
    }

    ai() {
        if (IsClient()) {
            return;
        }
        // 监听兵卒可攻击
        GameRules.EventManager.Register('Event_BZCanAtk', (event: { entity: CDOTA_BaseNPC_BZ }) => {
            if (this.IsNull()) {
                return true;
            }
            if (this.GetCaster() != event.entity) {
                return;
            }
            if (!AbilityManager.isCanOnAblt(this.GetCaster())) {
                return;
            }
            const nManaCast = this.GetManaCost(this.GetLevel() - 1);
            // print("===BZ_AI===0_nManaCast:", nManaCast)
            // 持续进行施法判断
            const tEventID = [];
            tEventID.push(
                GameRules.EventManager.Register('Event_BZCastAblt', tEvent => {
                    if (tEvent.ablt == this) {
                        tEvent.bIgnore = false;
                    }
                })
            );
            // print("===BZ_AI===1")
            const strTimerName = Timers.CreateTimer(() => {
                if (IsValid(this)) {
                    // print("===BZ_AI===2")
                    if (IsValid(this.GetCaster()['m_eAtkTarget']) && this.IsCooldownReady() && this.GetCaster().GetMana() == nManaCast) {
                        // print("===BZ_AI===3")
                        // 蓝满了放技能
                        ExecuteOrderFromTable({
                            UnitIndex: this.GetCaster().entindex(),
                            OrderType: UnitOrder.CAST_NO_TARGET,
                            TargetIndex: null,
                            AbilityIndex: this.GetEntityIndex(),
                            Position: null,
                            Queue: false,
                        });
                    }
                    // print("===BZ_AI===4_GetMana", this.GetCaster().GetMana())
                    return 0.1;
                }
            });
            // print("===BZ_AI===5")
            // 监听攻击结束
            tEventID.push(
                GameRules.EventManager.Register('Event_BZCantAtk', (tEventCantAtk: { entity: CDOTA_BaseNPC_BZ }) => {
                    if (this.IsNull() || this.GetCaster() == tEventCantAtk.entity) {
                        // print("===BZ_AI===6")
                        Timers.RemoveTimer(strTimerName);
                        for (const v of tEventID) {
                            GameRules.EventManager.UnRegisterByID(v);
                        }
                        return true;
                    }
                })
            );
        });
    }

    /**
     * 通用判断技能施法
     */
    isCanCast(eTarget?: CDOTA_BaseNPC): boolean {
        if (GameRules.GameConfig != null) {
            // 准备阶段不能施法
            if (GameRules.GameConfig.m_nRound == 0) {
                this.m_strCastError = 'AbilityError_Round0';
                return false;
            }

            // 非自己阶段不能施法
            if (!this.isCanCastOtherRound() && this.GetCaster().GetPlayerOwnerID() != GameRules.GameConfig.m_nOrderID) {
                this.m_strCastError = 'AbilityError_NotSelfRound';
                return false;
            }
            // 移动阶段不能施法
            if (!this.isCanCastMove() && GameRules.GameConfig.m_typeState == GS_Move) {
                this.m_strCastError = 'AbilityError_Move';
                return false;
            }
            // 补给阶段不能施法
            if (!this.isCanCastSupply() && GameRules.GameConfig.m_typeState == GS_Supply) {
                this.m_strCastError = 'AbilityError_Supply';
                return false;
            }
            // 亡国阶段不能施法
            if (GameRules.GameConfig.m_typeState == GS_DeathClearing) {
                this.m_strCastError = 'AbilityError_DeathClearing';
                return false;
            }
            // 等待阶段不能施法
            if (GameRules.GameConfig.m_typeState == GS_Wait && !this.yieldWait) {
                this.m_strCastError = 'AbilityError_Wait';
                return false;
            }

            // 验证施法玩家
            const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
            if (oPlayer != null) {
                // 在监狱不能施法
                if (!this.isCanCastInPrison() && (PS_InPrison & oPlayer.m_nPlayerState) > 0) {
                    this.m_strCastError = 'AbilityError_InPrison';
                    return false;
                }
                // 在英雄攻击时不能施法
                if (!this.isCanCastHeroAtk() && (PS_AtkHero & oPlayer.m_nPlayerState) > 0) {
                    this.m_strCastError = 'AbilityError_Battle';
                    return false;
                }
            }

            if (!this.isCanCastAtk() && oPlayer.m_bGCLD) {
                this.m_strCastError = 'AbilityError_Battle';
                return false;
            }

            // 验证目标单位
            if (eTarget && !this.checkTarget(eTarget)) {
                return false;
            }
        }
        return true;
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
}

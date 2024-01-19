import { PathManager } from '../../path/PathManager';
import { Path } from '../../path/Path';
import { player_info } from '../../player/player';
import { AMHC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { AbilityManager } from '../abilitymanager';
import { TSBaseAbility } from '../tsBaseAbilty';

/**

 */
@registerAbility()
export class Ability_dragon_knight_breathe_fire extends TSBaseAbility {
    // 方向 1为前，-1为后
    m_nForward: number;

    /**定义技能的施法距离 */
    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        if (IsClient()) {
            const tabPlayerInfo = CustomNetTables.GetTableValue('GamingTable', ('player_info_' + this.GetCaster().GetPlayerOwnerID()) as player_info);
            if (!tabPlayerInfo) return;
            const tabPathID = [];
            let range = math.floor(this.GetSpecialValueFor('range') / 2);
            // 火龙范围翻倍
            const nDragonLevel = this.GetCaster().GetModifierStackCount('modifier_dragonknight_elder_dragon_form', this.GetCaster()) - 1;
            if (nDragonLevel == 1) range *= 2;

            const [nPathIDQ, nPathIDH] = PathManager.getVertexPathID(tabPlayerInfo.nPathCurID);

            for (let i = 1; i <= range; i++) {
                let nPathID = PathManager.getNextPathID(tabPlayerInfo.nPathCurID, i);
                tabPathID.push(nPathID);
                if (nPathID == nPathIDQ) break;
            }
            for (let i = 1; i <= range; i++) {
                let nPathID = PathManager.getNextPathID(tabPlayerInfo.nPathCurID, -i);
                tabPathID.push(nPathID);
                if (nPathID == nPathIDH) break;
            }

            AbilityManager.showAbltMark(this, this.GetCaster(), tabPathID);
        }
        return 0;
    }

    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (!this.isCanCast(target)) return UnitFilterResult.FAIL_CUSTOM;
        else return UnitFilterResult.SUCCESS;
    }

    CastFilterResultLocation(location: Vector): UnitFilterResult {
        if (!this.isCanCast()) return UnitFilterResult.FAIL_CUSTOM;
        if (IsServer()) {
            const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
            if (player) {
                const path = GameRules.PathManager.getClosePath(location);
                // 距离
                let dis = ((location - path.m_entity.GetAbsOrigin()) as Vector).Length2D();
                if (dis > 150) {
                    this.m_strCastError = 'AbilityError_TargetPath';
                    return UnitFilterResult.FAIL_CUSTOM;
                }
                dis = math.floor(this.GetSpecialValueFor('range') / 2);
                // 火龙翻倍范围
                const nDragonLevel = this.GetCaster().GetModifierStackCount('modifier_dragonknight_elder_dragon_form', this.GetCaster()) - 1;
                if (nDragonLevel == 1) dis *= 2;

                const [nPathIDQ, nPathIDH] = PathManager.getVertexPathID(player.m_pathCur.m_nID);
                const tPathQ = [];
                const tPathH = [];
                let tempPath: Path;
                // 往前遍历至拐角处
                for (let i = 1; i <= dis; i++) {
                    tempPath = GameRules.PathManager.getNextPath(player.m_pathCur, i);
                    print('===fire-castlocation=往前=tempPath.m_nID:', tempPath.m_nID);
                    tPathQ.push(tempPath);
                    if (tempPath.m_nID == nPathIDQ) break;
                }
                // 根据目标路径判断方向
                for (const pathQ of tPathQ) {
                    if (pathQ == path) {
                        this.m_nForward = 1;
                        this.m_pathTarget = tempPath;
                        return UnitFilterResult.SUCCESS;
                    }
                }
                // 往后遍历至拐角处
                for (let i = 1; i <= dis; i++) {
                    tempPath = GameRules.PathManager.getNextPath(player.m_pathCur, -i);
                    print('===fire-castlocation=往后=tempPath.m_nID:', tempPath.m_nID);
                    tPathH.push(tempPath);
                    if (tempPath.m_nID == nPathIDH) break;
                }
                // 根据目标路径判断方向
                for (const pathH of tPathH) {
                    if (pathH == path) {
                        this.m_nForward = -1;
                        this.m_pathTarget = tempPath;
                        return UnitFilterResult.SUCCESS;
                    }
                }

                this.m_strCastError = 'AbilityError_Range';
                return UnitFilterResult.FAIL_CUSTOM;
            }
        }
        return UnitFilterResult.SUCCESS;
    }

    /**开始技能效果 */
    OnSpellStart() {
        if (!this.m_pathTarget) return;
        const caster = this.GetCaster();
        const player = GameRules.PlayerManager.getPlayer(caster.GetPlayerOwnerID());
        if (!player) return;

        const damage = this.GetSpecialValueFor('damage');
        const start_radius = this.GetSpecialValueFor('start_radius');
        const end_radius = this.GetSpecialValueFor('end_radius');
        const speed = this.GetSpecialValueFor('speed');
        // -1人类，0毒，1火，2冰
        const nDragonLevel = this.GetCaster().GetModifierStackCount('modifier_dragonknight_elder_dragon_form', caster) - 1;
        // 距离
        const fDis = ((this.m_pathTarget.m_entity.GetAbsOrigin() - caster.GetAbsOrigin()) as Vector).Length2D();
        // 方向
        let vDir = ((this.m_pathTarget.m_entity.GetAbsOrigin() - caster.GetAbsOrigin()) as Vector).Normalized();
        vDir = Vector(vDir.x, vDir.y, 0);

        // 特效
        const effectInfo: CreateLinearProjectileOptions = {
            EffectName: 'particles/units/heroes/hero_dragon_knight/dragon_knight_breathe_fire.vpcf',
            Ability: this,
            vSpawnOrigin: caster.GetAbsOrigin(),
            fStartRadius: start_radius,
            fEndRadius: end_radius,
            vVelocity: (vDir * speed) as Vector,
            fDistance: fDis,
            Source: caster,
        };
        if (nDragonLevel == 0) effectInfo.EffectName = 'particles/custom/abilitys/dragon_knight/dragon_knight_breathe_fire_0.vpcf';
        else if (nDragonLevel == 2) effectInfo.EffectName = 'particles/custom/abilitys/dragon_knight/dragon_knight_breathe_fire_2.vpcf';
        ProjectileManager.CreateLinearProjectile(effectInfo);
        EmitGlobalSound('Hero_DragonKnight.BreathFire');

        // 获取伤害目标
        let targets: CDOTA_BaseNPC[] = [];
        let i = 0;
        for (let n = GameRules.PathManager.m_tabPaths.length; n > 0; n--) {
            i += this.m_nForward;
            const path = GameRules.PathManager.getNextPath(player.m_pathCur, i);
            targets = targets.concat(path.getJoinEnt());
            if (path == this.m_pathTarget) break;
        }
        targets = targets.filter(entity => {
            return this.checkTarget(entity);
        });

        // 伤害
        for (const target of targets) {
            let nDamage = damage;
            const deBuff = target.FindModifierByName('modifier_dragon_knight_elder_dragon_form_debuff_1');
            if (IsValid(deBuff)) {
                const ability = caster.FindAbilityByName('Ability_dragon_knight_elder_dragon_form');
                if (IsValid(ability)) {
                    nDamage += ability.GetSpecialValueFor('debuff_fire_damage') * deBuff.GetStackCount();
                    print('===Ability_dragon_knight_elder_dragon_form===damage:', nDamage, 'stackCount:', deBuff.GetStackCount());
                    deBuff.Destroy();
                }
            }
            AMHC.Damage(caster, target, nDamage, this.GetAbilityDamageType(), this, 1);

            // 额外Debuff
            if (nDragonLevel != 1)
                AbilityManager.setCopyBuff(
                    'modifier_dragon_knight_breathe_fire_debuff_' + (nDragonLevel < 0 ? '01' : nDragonLevel),
                    target,
                    caster,
                    this
                );
        }

        // 触发耗蓝
        GameRules.EventManager.FireEvent('Event_HeroManaChange', { player: player, oAblt: this });
        // 设置冷却
        AbilityManager.setRoundCD(player, this);
    }
}

// 毒龙Buff
@registerModifier()
export class modifier_dragon_knight_breathe_fire_debuff_0 extends BaseModifier {
    debuff_armor_sub: number;
    debuff_move_speed_sub: number;
    m_nRound: number;
    IsDebuff(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        this.debuff_armor_sub = this.GetAbility().GetSpecialValueFor('debuff_armor_sub');
        this.debuff_move_speed_sub = this.GetAbility().GetSpecialValueFor('debuff_move_speed_sub');
        this.m_nRound = 1;
        if (IsServer()) AbilityManager.judgeBuffRound(this.GetParent().GetPlayerOwnerID(), this);
    }
    OnRefresh(params: object): void {
        this.debuff_armor_sub = this.GetAbility().GetSpecialValueFor('debuff_armor_sub');
        this.debuff_move_speed_sub = this.GetAbility().GetSpecialValueFor('debuff_move_speed_sub');
        this.m_nRound = 1;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PHYSICAL_ARMOR_BONUS, ModifierFunction.MOVESPEED_BONUS_CONSTANT, ModifierFunction.TOOLTIP];
    }
    GetModifierPhysicalArmorBonus(event: ModifierAttackEvent): number {
        return this.debuff_armor_sub;
    }
    OnTooltip(): number {
        return this.m_nRound;
    }
}

// 冰龙Buff
@registerModifier()
export class modifier_dragon_knight_breathe_fire_debuff_2 extends modifier_dragon_knight_breathe_fire_debuff_0 {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE];
    }
    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.debuff_move_speed_sub;
    }
}

// 人形态
@registerModifier()
export class modifier_dragon_knight_breathe_fire_debuff_01 extends modifier_dragon_knight_breathe_fire_debuff_0 {
    GetEffectName(): string {
        return 'particles/generic_gameplay/generic_silenced.vpcf';
    }
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.OVERHEAD_FOLLOW;
    }
    CheckState(): Partial<Record<ModifierState, boolean>> {
        return { [ModifierState.SILENCED]: true };
    }
}

import { TypePathState } from '../constants/constant';
import { Player } from '../player/player';

/**路径基类 */
export class Path {
    m_nID: number; // 路径ID
    m_typePath: number; // 路径类型

    m_entity: CBaseEntity; // 路径实体
    m_eUnit = null; // 路径提示单位

    m_tabEJoin: CEntityInstance[]; // 停留在路径上的实体
    m_tabPos: {
        entity: CEntityInstance;
        vPos: Vector;
    }[]; // 全部身位

    m_typeState: number; // 领地状态

    constructor(entity: CBaseEntity) {
        if (entity == null) return;

        this.m_entity = entity;
        this.m_typePath = entity.GetIntAttr('PathType');
        this.m_tabEJoin = [];
        this.m_tabPos = [];
        // 截取ID
        let strName = entity.GetName();
        strName = strName.slice(5);
        this.m_nID = tonumber(strName);

        // 创建提示单位
        this.m_eUnit = CreateUnitByName('PathLog_' + this.m_nID, this.m_entity.GetAbsOrigin(), false, null, null, DotaTeam.NEUTRALS);

        this.initNilPos();
        this.setPathState(TypePathState.None);
    }

    /** 添加路径上的实体 */
    setEntityAdd(entity: CDOTA_BaseNPC) {
        let bHas = false;
        for (let index = 0; index < this.m_tabEJoin.length; index++) {
            const value = this.m_tabEJoin[index];
            if (value == entity) {
                bHas = true;
                break;
            }
        }
        if (!bHas) {
            this.m_tabEJoin = this.m_tabEJoin.concat(entity);
        }
        // 设置朝向下一个路径
        const pathNext = GameRules.PathManager.getNextPath(this, 1);
        let v3 = (pathNext.m_entity.GetAbsOrigin() - this.m_entity.GetAbsOrigin()) as Vector;
        v3 = v3.Normalized();
        Timers.CreateTimer(0.1, () => {
            entity.MoveToPosition((entity.GetAbsOrigin() + v3) as Vector);
        });
    }

    /** 移除路径上实体 */
    setEntityDel(entity: CEntityInstance) {
        for (let index = 0; index < this.m_tabEJoin.length; index++) {
            const value = this.m_tabEJoin[index];
            if (value == entity) {
                this.m_tabEJoin[index] = null;

                // 从英雄身位中移除
                for (let index2 = 0; index2 < this.m_tabPos.length; index2++) {
                    const value2 = this.m_tabPos[index2];
                    if (entity == value2.entity) {
                        value2.entity = null;
                        return;
                    }
                }
                return;
            }
        }
    }

    /**初始化空位数据 */
    initNilPos() {
        this.m_tabPos.push({
            entity: null,
            vPos: (this.m_entity.GetRightVector() * 40 + this.m_entity.GetAbsOrigin()) as Vector,
        });
        this.m_tabPos.push({
            entity: null,
            vPos: (this.m_entity.GetRightVector() * -40 + this.m_entity.GetAbsOrigin()) as Vector,
        });
        this.m_tabPos.push({
            entity: null,
            vPos: (this.m_entity.GetRightVector() * 40 + this.m_entity.GetForwardVector() * 10 + this.m_entity.GetAbsOrigin()) as Vector,
        });
        this.m_tabPos.push({
            entity: null,
            vPos: (this.m_entity.GetRightVector() * -40 + this.m_entity.GetForwardVector() * 10 + this.m_entity.GetAbsOrigin()) as Vector,
        });
        this.m_tabPos.push({
            entity: null,
            vPos: (this.m_entity.GetRightVector() * 40 - this.m_entity.GetForwardVector() * 10 + this.m_entity.GetAbsOrigin()) as Vector,
        });
        this.m_tabPos.push({
            entity: null,
            vPos: (this.m_entity.GetRightVector() * -40 - this.m_entity.GetForwardVector() * 10 + this.m_entity.GetAbsOrigin()) as Vector,
        });
    }

    /**设置路径交易类型 */
    setPathState(typeState: TypePathState) {
        this.m_typeState = typeState;
    }

    /**获得一个空位,并占用 */
    getNilPos(entity: CDOTA_BaseNPC_Hero) {
        for (let i = 1; i < this.m_tabPos.length; i++) {
            const v = this.m_tabPos[i];
            if (v.entity == null) {
                // 空位置
                v.entity = entity;
                return v.vPos;
            }
        }
        return this.m_entity.GetAbsOrigin();
    }

    /**获得单位已经占用的位置 */
    getUsedPos(entity: CDOTA_BaseNPC_Hero, bInPrison?: boolean) {
        if (bInPrison) {
            for (const v of this.m_tabPos) {
                if (entity == v.entity) {
                    return v.vPos;
                }
            }
        }
        return this.m_entity.GetAbsOrigin();
    }

    // 触发路径
    onPath(player: Player) {
        GameRules.EventManager.FireEvent('Event_OnPath', {
            path: this,
            entity: player.m_eHero,
        });
    }
}

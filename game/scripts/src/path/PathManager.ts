import { AHMC } from "../utils/amhc";
import { reloadable } from "../utils/tstl-utils";
import { Path } from "./Path";
import { PathDomain } from "./pathdomain";
import { PathFactory } from "./pathfactory";
import { PathTP } from "./pathtp";

@reloadable
export class PathManager {

    /**全部路径 */
    m_tabPaths: Path[] = null
    m_tabMoveData: {
        nEntId: EntityIndex
        funCallBack: Function
    }[] = null

    init() {
        // 获取全部路径实体
        this.m_tabPaths = []
        this.m_tabMoveData = []
        let tabAllPathEntities = Entities.FindAllByClassname("path_corner")
        for (let index = 0; index < tabAllPathEntities.length; index++) {
            const value = tabAllPathEntities[index]
            if (string.sub(value.GetName(), 1, 4) == "path") {
                // 生成对象
                const oPath = PathFactory.create(value)
                this.m_tabPaths.push(oPath)
                // 路径视野
                AddFOWViewer(DotaTeam.GOODGUYS, value.GetAbsOrigin() + Vector(0, 0, 500) as Vector, 400, -1, true)
            }
            this.m_tabPaths.sort((a, b) => {
                return a.m_nID - b.m_nID
            })

            // 同步网标路径信息
            this.setNetTableInfo()
        }
    }

    /** 获取当前路径的下个路径 */
    getNextPath(pathCur: Path, nDis: number): Path {
        for (let index = 0; index < this.m_tabPaths.length; index++) {
            if (this.m_tabPaths[index] == pathCur) {
                let nIndex = index + nDis
                if (nIndex > this.m_tabPaths.length - 1)
                    nIndex = nIndex % this.m_tabPaths.length
                else if (nIndex <= 0)
                    nIndex += this.m_tabPaths.length
                return this.m_tabPaths[nIndex]
            }
        }
    }

    /** 获取路径对象 */
    getPathByType(type: number) {
        let tabPath: Path[] = []
        for (let index = 0; index < this.m_tabPaths.length; index++) {
            if (type == this.m_tabPaths[index].m_typePath) {
                tabPath.push(this.m_tabPaths[index])
            }
        }
        return tabPath
    }

    /**获取路径对象 */
    getPathByID(nID: number) {
        for (let index = 0; index < this.m_tabPaths.length; index++) {
            if (nID == this.m_tabPaths[index].m_nID)
                return this.m_tabPaths[index]
        }
    }

    /**获取A路径到B路径的路径距离 */
    getPathDistance(oPathBegin: Path, oPathEnd: Path, bReverse?: boolean) {
        if (oPathBegin == oPathEnd) return 0

        let nDis = 0

        for (let i = 0; i < this.m_tabPaths.length; i++) {
            if (oPathBegin == this.m_tabPaths[i]) {
                for (let j = 0; j < this.m_tabPaths.length; j++) {
                    if (oPathEnd == this.m_tabPaths[j]) {
                        if (bReverse) {
                            nDis = i - j
                        } else {
                            nDis = j - i
                        }
                        if (nDis < 0) {
                            nDis += this.m_tabPaths.length
                        }
                        break
                    }
                }
                break
            }
        }
        return nDis
    }

    /**设置玩家网表信息 */
    setNetTableInfo() {
        let tabData: {
            vPos: {
                x: number;
                y: number;
                z: number;
            }
        }[] = []
        for (let i = 0; i < this.m_tabPaths.length; i++) {
            tabData.push({
                vPos: {
                    x: this.m_tabPaths[i].m_entity.GetAbsOrigin().x,
                    y: this.m_tabPaths[i].m_entity.GetAbsOrigin().y,
                    z: this.m_tabPaths[i].m_entity.GetAbsOrigin().z
                }
            })
        }

        // 设置网表
        CustomNetTables.SetTableValue("GamingTable", "path_info", tabData)
    }

    /**路径寻路移动 */
    moveToPath(entity: CDOTA_BaseNPC_Hero, path: Path, bEventEnable: boolean, funCallBack: Function) {
        const oPlayer = GameRules.PlayerManager.getPlayer(entity.GetPlayerID())
        const pathBegin = oPlayer.m_pathCur
        let pathCur = pathBegin
        // 当前路径是否为目的地
        let pathNext = pathCur == path ? pathCur : this.getNextPath(pathCur, 1)
        let vNext: Vector
        function getNextPos() {
            if (pathNext == path) {
                vNext = pathNext.getNilPos(entity)
            } else {
                vNext = pathNext.m_entity.GetOrigin()
            }
        }
        getNextPos()

        entity.MoveToPosition(vNext)

        const nEntId = entity.GetEntityIndex()
        // 结束上次移动
        if (this.m_tabMoveData[nEntId]) this.moveStop(entity, false)
        // 新的移动
        const tMoveData = {
            nEntId: nEntId,
            funCallBack: funCallBack
        }
        this.m_tabMoveData[nEntId] = tMoveData

        // 持续寻路
        Timers.CreateTimer(() => {
            if (tMoveData != this.m_tabMoveData[nEntId]) return
            if (!AHMC.IsValid(entity) || !entity.IsAlive()) {
                this.moveStop(entity, false)
                return
            }
            // 检验每个寻路点path_corner
            const nDis = (entity.GetOrigin() - vNext as Vector).Length2D()
            let nCheckDis = 30
            if (pathNext != path) {
                nCheckDis = entity.GetIdealSpeed() * 0.35 - 75
                if (nCheckDis < 30) nCheckDis = 30
            }
            if (nDis < nCheckDis) {
                // 触发事件: 途径某路径
                if (pathBegin != pathNext && bEventEnable) {
                    GameRules.EventManager.FireEvent("Event_PassingPath", { path: pathNext, entity: entity })
                }
                if (pathNext == path) {
                    // 移动结束
                    this.moveStop(entity, true)
                    return null
                } else {
                    // 移动至下一个路径点
                    pathCur = pathNext
                    pathNext = this.getNextPath(pathCur, 1)
                    if (pathNext == null || pathNext == pathCur) {
                        this.moveStop(entity, true)
                        return
                    }
                    getNextPos()
                }
            }
            entity.MoveToPosition(vNext)
            return 0.1
        })
        return true
    }

    moveStop(entity: CDOTA_BaseNPC_Hero, bSuccess: boolean) {
        const tMoveData = this.m_tabMoveData[entity.GetEntityIndex()]
        if (tMoveData == null) return
        this.m_tabMoveData[entity.GetEntityIndex()] = null
        if (tMoveData.funCallBack != null)
            tMoveData.funCallBack(bSuccess)
    }
}
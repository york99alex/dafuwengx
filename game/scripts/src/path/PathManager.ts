import { Path } from "./Path";
import { PathFactory } from "./pathfactory";

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
    getNextPath(pathCur: Path, nDis: number) {
        for (let index = 0; index < this.m_tabPaths.length; index++) {
            if (this.m_tabPaths[index] == pathCur) {
                let nIndex = index + nDis
                if (nIndex > this.m_tabPaths.length)
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
}
export class UIHelper {
    static findOtheXMLPanel(strPanelID: string) {
        let varPanel = null;
        if (null == varPanel) {
            let panel: Panel | null = $.GetContextPanel();
            while (null != panel) {
                varPanel = panel;
                panel = panel.GetParent();
            }
        }
        if (null != varPanel) {
            return varPanel.FindChildTraverse(strPanelID);
        }
        return null;
    }
}

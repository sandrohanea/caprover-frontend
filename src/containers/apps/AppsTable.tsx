import {
    CheckOutlined,
    CodeOutlined,
    DisconnectOutlined,
    LinkOutlined,
    LoadingOutlined,
} from '@ant-design/icons'
import { Card, Col, Input, Row, Table, Tooltip } from 'antd'
import { ColumnProps } from 'antd/lib/table'
import { History } from 'history'
import React from 'react'
import { connect } from 'react-redux'
import { IMobileComponent } from '../../models/ContainerProps'
import Toaster from '../../utils/Toaster'
import ApiComponent from '../global/ApiComponent'
import ClickableLink from '../global/ClickableLink'
import NewTabLink from '../global/NewTabLink'
import TagsComponent from '../global/TagsComponent'
import Timestamp from '../global/Timestamp'
import { IAppDef, IAppTag } from './AppDefinition'

type TableData = IAppDef & { lastDeployTime: string }

class AppsTable extends ApiComponent<
    {
        history: History
        apps: IAppDef[]
        rootDomain: string
        defaultNginxConfig: string
        isMobile: boolean
    },
    { searchTerm: string; tags: IAppTag[]; apps: IAppDef[]; allTags: IAppTag[] }
> {
    constructor(props: any) {
        super(props)
        const apps: IAppDef[] = props.apps
        this.state = {
            searchTerm: '',
            tags: [],
            apps: apps,
            allTags: this.createAllTags(apps),
        }
    }

    createAllTags(apps: IAppDef[]): IAppTag[] {
        const tags: IAppTag[] = []
        const tagNames = new Set()

        apps.forEach((app) => {
            app.tags.forEach((tag) => {
                if (!tagNames.has(tag.tagName)) {
                    tagNames.add(tag.tagName)
                    tags.push(tag)
                }
            })
        })
        return tags.sort((tag1, tag2) => (tag1.tagName > tag2.tagName ? 1 : -1))
    }

    onAppClicked(appName: string) {
        this.props.history.push(`/apps/details/${appName}`)
    }

    onAppTagAdded(tag: IAppTag, appName: string | undefined) {
        const self = this
        const apps = self.state.apps
        const currentAppIndex = apps.findIndex((app) => app.appName === appName)
        const currentApp = apps[currentAppIndex]
        if (tag.tagName === '') {
            return
        }
        if (currentApp?.appName) {
            self.apiManager
                .addAppTag(currentApp.appName, tag.tagName)
                .then(function () {
                    currentApp.tags.push(tag)
                    const allTags = self.state.allTags
                    if (!allTags.some((t) => t.tagName === tag.tagName)) {
                        allTags.push(tag)
                    }
                    self.setState({ apps: apps, allTags: allTags })
                })
                .catch(Toaster.createCatcher())
        }
    }

    onAppTagRemoved(tag: IAppTag, appName: string | undefined) {
        const self = this
        const apps = self.state.apps
        const currentAppIndex = apps.findIndex((app) => app.appName === appName)
        const currentApp = apps[currentAppIndex]

        if (currentApp?.appName) {
            self.apiManager
                .removeAppTag(currentApp.appName, tag.tagName)
                .then(function () {
                    const currentTagIndex = currentApp.tags.findIndex(
                        (t) => t.tagName === tag.tagName
                    )

                    if (currentTagIndex >= 0) {
                        currentApp.tags.splice(currentTagIndex, 1)
                    }

                    self.setState({ apps: apps })
                })
                .catch(Toaster.createCatcher())
        }
    }

    onFilterTagAdded(tag: IAppTag) {
        const self = this
        const currentTags = self.state.tags
        if (
            !currentTags.some((t) => t.tagName === tag.tagName) &&
            tag.tagName !== ''
        ) {
            currentTags.push(tag)
            this.setState({ tags: currentTags })
        }
    }

    onFilterTagRemoved(tag: IAppTag) {
        const self = this
        const currentTags = self.state.tags
        const indexOfCurrentTag = currentTags.findIndex(
            (t) => t.tagName === tag.tagName
        )
        if (indexOfCurrentTag >= 0) {
            currentTags.splice(indexOfCurrentTag, 1)
            this.setState({ tags: currentTags })
        }
    }

    createColumns(): ColumnProps<TableData>[] {
        const self = this
        const ALIGN: 'center' = 'center'
        return [
            {
                title: 'App Name',
                dataIndex: 'appName',
                key: 'appName',
                render: (appName: string) => (
                    <ClickableLink
                        onLinkClicked={() => self.onAppClicked(appName)}
                    >
                        {appName}
                    </ClickableLink>
                ),
                sorter: (a, b) => {
                    return a.appName
                        ? a.appName.localeCompare(b.appName || '')
                        : 0
                },
                defaultSortOrder: 'ascend',
                sortDirections: ['descend', 'ascend'],
            },
            {
                title: 'Persistent Data	',
                dataIndex: 'hasPersistentData',
                key: 'hasPersistentData',
                align: ALIGN,
                render: (hasPersistentData: boolean) => {
                    if (!hasPersistentData) {
                        return <span />
                    }

                    return (
                        <span>
                            <CheckOutlined />
                        </span>
                    )
                },
            },
            {
                title: 'Instance Count',
                dataIndex: 'instanceCount',
                key: 'instanceCount',
                align: ALIGN,
            },
            {
                title: 'Last Deployed',
                dataIndex: 'lastDeployTime',
                key: 'lastDeployTime',
                align: ALIGN,
                sorter: (a, b) => {
                    return (
                        new Date(b.lastDeployTime).getTime() -
                        new Date(a.lastDeployTime).getTime()
                    )
                },
                render: (lastDeployTime: string, app) => {
                    if (!lastDeployTime) {
                        return <span />
                    }

                    return (
                        <span>
                            <Timestamp timestamp={lastDeployTime} />
                            {!!app.isAppBuilding ? (
                                <LoadingOutlined
                                    style={{
                                        fontSize: '12px',
                                        paddingLeft: 12,
                                    }}
                                />
                            ) : undefined}
                        </span>
                    )
                },
            },
            {
                title: 'Tags',
                dataIndex: 'tags',
                key: 'tags',
                align: ALIGN,
                render: (tags: IAppTag[], app) => {
                    return (
                        <TagsComponent
                            allTags={this.state.allTags}
                            tags={tags}
                            onTagAdded={(tag: IAppTag) => {
                                this.onAppTagAdded(tag, app.appName)
                            }}
                            onTagClick={this.onFilterTagAdded.bind(this)}
                            onTagRemoved={(tag: IAppTag) => {
                                this.onAppTagRemoved(tag, app.appName)
                            }}
                        />
                    )
                },
            },
            {
                title: 'Open',
                dataIndex: 'notExposeAsWebApp',
                key: 'openInBrowser',
                align: ALIGN,
                render: (notExposeAsWebApp: boolean, app) => {
                    if (notExposeAsWebApp) {
                        return (
                            <Tooltip title="Not exposed as a web app">
                                <DisconnectOutlined />
                            </Tooltip>
                        )
                    }

                    return (
                        <NewTabLink
                            url={`http${
                                app.hasDefaultSubDomainSsl ? 's' : ''
                            }://${app.appName}.${self.props.rootDomain}`}
                        >
                            <LinkOutlined />{' '}
                        </NewTabLink>
                    )
                },
            },
        ]
    }

    render() {
        const self = this

        const appsToRender = self.state.apps
            .filter((app) => {
                if (!self.state.searchTerm && self.state.tags.length === 0)
                    return true

                return (
                    app.appName!.indexOf(self.state.searchTerm) >= 0 &&
                    self.state.tags.every((tag) =>
                        app.tags.some((t) => t.tagName === tag.tagName)
                    )
                )
            })
            .map((app) => {
                const lastDeployTime =
                    app.versions.filter(
                        (v) => v.version === app.deployedVersion
                    )[0].timeStamp || ''
                return { ...app, lastDeployTime }
            })

        const searchAndFilterAppInput = (
            <Row align="middle">
                <Col>
                    <h3>Filtered by tags:&nbsp;&nbsp;</h3>
                </Col>
                <Col>
                    <TagsComponent
                        allTags={this.state.allTags}
                        tags={this.state.tags}
                        onTagAdded={(tag: IAppTag) => {
                            this.onFilterTagAdded(tag)
                        }}
                        onTagRemoved={(tag: IAppTag) => {
                            this.onFilterTagRemoved(tag)
                        }}
                    />
                </Col>
                <Col>
                    <Input
                        placeholder="Search by Name"
                        type="text"
                        onChange={(event) =>
                            self.setState({
                                searchTerm: (event.target.value || '').trim(),
                            })
                        }
                    />
                </Col>
            </Row>
        )

        return (
            <Row justify="center">
                <Col
                    xs={{ span: 23 }}
                    lg={{ span: 16 }}
                    style={{ paddingBottom: 300 }}
                >
                    <Card
                        extra={!self.props.isMobile && searchAndFilterAppInput}
                        title={
                            <React.Fragment>
                                <span>
                                    <CodeOutlined />
                                    &nbsp;&nbsp;&nbsp;Your Apps
                                </span>
                                <br />
                                {self.props.isMobile && searchAndFilterAppInput}
                            </React.Fragment>
                        }
                    >
                        <Row justify="center">
                            {self.props.isMobile ? (
                                appsToRender.map(
                                    ({
                                        appName = '',
                                        hasPersistentData,
                                        notExposeAsWebApp,
                                        instanceCount,
                                        hasDefaultSubDomainSsl,
                                        tags,
                                    }) => (
                                        <Card
                                            type="inner"
                                            title={appName}
                                            key={appName}
                                            extra={
                                                <ClickableLink
                                                    onLinkClicked={() =>
                                                        self.onAppClicked(
                                                            appName
                                                        )
                                                    }
                                                >
                                                    Details
                                                </ClickableLink>
                                            }
                                        >
                                            <p>
                                                Persistent Data:{' '}
                                                {!hasPersistentData ? undefined : (
                                                    <span>
                                                        <CheckOutlined />
                                                    </span>
                                                )}
                                            </p>
                                            <p>
                                                Exposed Webapp:{' '}
                                                {!!notExposeAsWebApp ? undefined : (
                                                    <span>
                                                        <CheckOutlined />
                                                    </span>
                                                )}
                                            </p>
                                            <p>
                                                Instance Count: {instanceCount}
                                            </p>
                                            <p>Tags : {tags.length}</p>
                                            <p>
                                                Open in Browser:{' '}
                                                {!!notExposeAsWebApp ? undefined : (
                                                    <NewTabLink
                                                        url={`http${
                                                            hasDefaultSubDomainSsl
                                                                ? 's'
                                                                : ''
                                                        }://${appName}.${
                                                            self.props
                                                                .rootDomain
                                                        }`}
                                                    >
                                                        <LinkOutlined />{' '}
                                                    </NewTabLink>
                                                )}
                                            </p>
                                        </Card>
                                    )
                                )
                            ) : (
                                <div
                                    style={{
                                        width: '100%',
                                    }}
                                >
                                    <Table<TableData>
                                        rowKey="appName"
                                        columns={self.createColumns()}
                                        dataSource={appsToRender}
                                        pagination={false}
                                        size="middle"
                                    />
                                </div>
                            )}
                        </Row>
                    </Card>
                </Col>
            </Row>
        )
    }
}

function mapStateToProps(state: any) {
    return {
        isMobile: state.globalReducer.isMobile,
    }
}

export default connect<IMobileComponent, any, any>(
    mapStateToProps,
    undefined
)(AppsTable)

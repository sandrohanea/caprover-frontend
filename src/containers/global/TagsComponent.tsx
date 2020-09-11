import { PlusOutlined } from '@ant-design/icons'
import { AutoComplete, Row, Select, Tag } from 'antd'
import React, { Component } from 'react'
import { IAppTag } from '../apps/AppDefinition'

export default class TagsComponent extends Component<
    {
        tags: IAppTag[]
        onTagClick: ((tag: IAppTag) => void) | undefined
        onTagRemoved: (tag: IAppTag) => void
        onTagAdded: (tag: IAppTag) => void
        allTags: IAppTag[]
    },
    {
        newTagName: string
        isInputVisible: boolean
        options: { value: string }[]
        isAutocompleteOpened: boolean
        allTags: IAppTag[]
    }
> {
    public static defaultProps: {
        onTagClick: ((tag: IAppTag) => void) | undefined
    } = {
        onTagClick: undefined,
    }
    autocompleteRef: React.RefObject<Select>

    constructor(props: any) {
        super(props)
        this.state = {
            newTagName: '',
            isInputVisible: false,
            options: this.getAvailableOptions('', props.allTags),
            isAutocompleteOpened: false,
            allTags: props.allTags,
        }
        this.autocompleteRef = React.createRef()
    }

    getAvailableOptions(
        input: string,
        allTags: IAppTag[]
    ): { value: string }[] {
        return allTags
            .filter((tag) => input === '' || tag.tagName.includes(input))
            .map((t) => {
                return {
                    value: t.tagName,
                }
            })
    }

    showInput = () => {
        this.setState(
            { isInputVisible: true, isAutocompleteOpened: true },
            () => {
                this.autocompleteRef.current?.focus()
            }
        )
    }

    handleInputChange = (newValue: string, option: any) => {
        this.setState({
            newTagName: newValue,
            options: this.getAvailableOptions(newValue, this.state.allTags),
        })
    }

    handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            this.handleInputConfirm()
        }
    }

    handleOnSelect = (tagName: string, selectedValue: any) => {
        this.setState({ newTagName: tagName }, this.handleInputConfirm)
    }

    handleInputConfirm = () => {
        this.props.onTagAdded({ tagName: this.state.newTagName })
        const allTags = this.state.allTags
        if (!allTags.some((tag) => tag.tagName === this.state.newTagName)) {
            allTags.push({ tagName: this.state.newTagName })
        }
        this.setState({
            isInputVisible: false,
            newTagName: '',
            allTags: allTags,
            options: this.getAvailableOptions('', allTags),
        })
    }

    render() {
        const { isInputVisible, newTagName } = this.state

        return (
            <Row>
                {this.props.tags.map((tag) => (
                    <Tag
                        key={tag.tagName}
                        closable
                        color="geekblue"
                        onClose={(e: { preventDefault: () => void }) => {
                            e.preventDefault()
                            this.props.onTagRemoved(tag)
                        }}
                        onClick={() => {
                            if (this.props.onTagClick) {
                                this.props.onTagClick(tag)
                            }
                        }}
                    >
                        {tag.tagName}
                    </Tag>
                ))}
                {isInputVisible && (
                    <AutoComplete
                        ref={this.autocompleteRef}
                        size="small"
                        style={{ width: 78 }}
                        value={newTagName}
                        open={this.state.isAutocompleteOpened}
                        options={this.state.options}
                        onBlur={this.handleInputConfirm}
                        onSelect={this.handleOnSelect}
                        onChange={this.handleInputChange}
                        onInputKeyDown={this.handleInputKeyDown}
                    />
                )}
                {!isInputVisible && (
                    <Tag onClick={this.showInput} className="site-tag-plus">
                        <PlusOutlined /> New Tag
                    </Tag>
                )}
            </Row>
        )
    }
}

import * as React from "react";
import * as R from "ramda";

import { List, ListItem } from "material-ui/List";
import Avatar from "material-ui/Avatar";
import Divider from "material-ui/Divider";
import { TextBox } from "../../components";


import "./style.less";

export namespace EntityList {
	export interface Props {
		label: string;
		nameProp: string;
		entities: any[];
		onItemClick: (id: any) => void;
	}
	export interface State {
	}
}

export class EntityList extends React.Component<EntityList.Props, EntityList.State> {

	state = {
		searchWord: ""
	};
	setSearch = ({target: {value}}) => {
		this.setState({searchWord: value});
	}

	render () {
		const { entities } = this.props;
		const filteredEntities = R.filter(
			R.pipe(
				R.prop(this.props.nameProp),
				R.toLower,
				R.contains(this.state.searchWord)
			)
		, entities);

		return (
			<div style={{display: "contents"}}>
					<div className="fixed">
						<TextBox
							className={"search-box"}
							onChange={this.setSearch}
							hintText={`Search ${this.props.label}`}
						/>
					</div>

					<div className="scrolled">
						<List>
							{R.map((entity: any) => {
								const itemClick = () => this.props.onItemClick(entity._id);

								return <ListItem
										onClick={itemClick}
										className="list-item"
										key={entity._id}
										primaryText={entity[this.props.nameProp]}
										leftAvatar={<Avatar>{R.pipe(R.head, R.toUpper)(entity[this.props.nameProp])}</Avatar>}
									/>;
							}
							)(filteredEntities.reverse())}

							{R.isEmpty(filteredEntities) &&
								<ListItem
								className="list-item"
								primaryText={`No ${this.props.label} found`}/>
							}
						</List>
					</div>
					{this.props.children}
				<Divider />
			</div>
		);
	}
}

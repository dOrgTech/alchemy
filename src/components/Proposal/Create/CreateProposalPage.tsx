import { IPluginState, IContributionRewardExtState, IGenericPluginState, IContributionRewardState } from "@dorgtech/arc.js";
import { getArc } from "arc";
import CreateKnownGenericPluginProposal from "components/Proposal/Create/PluginForms/CreateKnownGenericPluginProposal";
import CreatePluginRegistrarProposal from "components/Proposal/Create/PluginForms/CreatePluginRegistrarProposal";
import CreateUnknownGenericPluginProposal from "components/Proposal/Create/PluginForms/CreateUnknownGenericPluginProposal";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { GenericPluginRegistry } from "genericPluginRegistry";
import Analytics from "lib/analytics";
import { History } from "history";
import { Page } from "pages";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { RouteComponentProps } from "react-router-dom";
import { CrxRewarderComponentType, getCrxRewarderComponent, rewarderContractName } from "components/Plugin/ContributionRewardExtRewarders/rewardersProps";
import CreateContributionRewardProposal from "components/Proposal/Create/PluginForms/CreateContributionRewardProposal";
import { pluginName } from "lib/pluginUtils";
import * as css from "./CreateProposal.scss";
import { from } from "rxjs";
import { first } from "rxjs/operators";
import CreatePluginManagerProposal from "./PluginForms/CreatePluginManagerProposal";

type IExternalProps = RouteComponentProps<any>;

interface IExternalStateProps {
  daoAvatarAddress: string;
  history: History;
  pluginId: string;
}

interface IStateProps {
  createCrxProposalComponent: any;
}

type IProps = IExternalProps & IExternalStateProps & ISubscriptionProps<IPluginState>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IExternalStateProps => {
  return {
    ...ownProps,
    daoAvatarAddress: ownProps.match.params.daoAvatarAddress,
    pluginId: ownProps.match.params.pluginId,
  };
};

class CreateProposalPage extends React.Component<IProps, IStateProps> {

  constructor(props: IProps) {
    super(props);
    this.state = {
      createCrxProposalComponent: null,
    };
  }

  public handleClose = (e: any) => {
    e.preventDefault();
    this.doClose();
  }

  public doClose = () => {
    const { daoAvatarAddress, history, pluginId } = this.props;
    history.push("/dao/" + daoAvatarAddress + "/plugin/" + pluginId);
  }

  public async componentDidMount() {
    document.addEventListener("keydown", this.handleKeyPress, false);

    Analytics.track("Page View", {
      "Page Name": Page.CreateProposal,
      "DAO Address": this.props.daoAvatarAddress,
      "Plugin Address": this.props.pluginId,
    });
    const newState = {};

    /**
     * Get the "CreateProposal" modal dialog component supplied by the rewarder contract associated
     * with this CrExt plugin (if it is a CrExt plugin -- very cheap if not a CrExt).
     */
    if (!this.state.createCrxProposalComponent) {
      Object.assign(newState, { createCrxProposalComponent: await getCrxRewarderComponent(
        this.props.data as IContributionRewardExtState, CrxRewarderComponentType.CreateProposal
      ) });
    }

    this.setState(newState);
  }

  public componentWillUnmount(){
    document.removeEventListener("keydown", this.handleKeyPress, false);
  }

  private handleKeyPress = (e: any) => {
    // Close modal on ESC key press
    if (e.keyCode === 27) {
      this.doClose();
    }
  }

  public render(): RenderOutput {
    const { daoAvatarAddress } = this.props;
    const pluginState = this.props.data;

    let createPluginComponent = <div />;
    const props = {
      daoAvatarAddress,
      handleClose: this.doClose,
      pluginState,
    };
    const pluginTitle = this.state.createCrxProposalComponent ? rewarderContractName(pluginState as IContributionRewardExtState) : pluginName(pluginState);

    if (this.state.createCrxProposalComponent) {
      createPluginComponent = <this.state.createCrxProposalComponent {...props} />;
    } else if (pluginState.name === "ContributionReward") {
      createPluginComponent = <CreateContributionRewardProposal {...props} pluginState={props.pluginState as IContributionRewardState} />;
    } else if (pluginState.name === "SchemeRegistrar") {
      createPluginComponent = <CreatePluginRegistrarProposal {...props} />;
    } else if (pluginState.name === "SchemeFactory") {
      createPluginComponent = <CreatePluginManagerProposal {...props} />;
    } else if (pluginState.name === "GenericScheme") {
      let contractToCall = (pluginState as IGenericPluginState).pluginParams.contractToCall;
      if (!contractToCall) {
        throw Error("No contractToCall for this genericPlugin was found!");
      }
      const genericPluginRegistry = new GenericPluginRegistry();
      const genericPluginInfo = genericPluginRegistry.getPluginInfo(contractToCall);
      if (genericPluginInfo) {
        createPluginComponent = <CreateKnownGenericPluginProposal  {...props} genericPluginInfo={genericPluginInfo} />;
      } else {
        createPluginComponent = <CreateUnknownGenericPluginProposal {...props} />;
      }
    }

    return (
      <div className={css.createProposalWrapper}>
        <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/plugin/${pluginState.id}/proposals/create`}>Create {pluginTitle} Proposal</BreadcrumbsItem>
        <h2 className={css.header}>
          <span>+ New proposal <b>| {pluginTitle}</b></span>
          <button className={css.closeButton} aria-label="Close Create Proposal Modal" onClick={this.handleClose}>&times;</button>
        </h2>
        { createPluginComponent }
      </div>
    );
  }
}

const SubscribedCreateProposalPage = withSubscription({
  wrappedComponent: CreateProposalPage,
  loadingComponent: <Loading/>,
  errorComponent: null,
  checkForUpdate: ["daoAvatarAddress"],
  createObservable: async (props: IExternalStateProps) => {
    const arc = getArc();
    const plugin = await arc.plugins({ where: { id: props.pluginId } }).pipe(first()).toPromise();
    return from(plugin[0].fetchState());
  },
});

export default connect(mapStateToProps)(SubscribedCreateProposalPage);

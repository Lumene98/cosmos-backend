import sys
from pyteal import *
from utils import parseArgs

TXN_TYPE_CREATE_SELL = Bytes("cs")
TXN_TYPE_CREATE_AUCTION = Bytes("ca")
TXN_TYPE_BUY = Bytes("b")
TXN_TYPE_REDEEM_CLOSE_ESCROW = Bytes("rce")
TXN_TYPE_OFFER_AUCTION = Bytes("oa")


def approval_program(args):
    scale = Int(1000)

    asset_reserve = AssetParam().reserve(Int(0))
    creator_address = App.globalGet(Bytes("god"))
    end_round = App.localGetEx(
        Int(1), Global.current_application_id(), Bytes("end_round")
    )

    def check_creator(creator: MaybeValue, asset_txn: int) -> Seq:
        return Seq(
            [
                creator,
                And(
                    creator.hasValue(),
                    creator.value() == creator_address,
                    Txn.assets[0] == Gtxn[asset_txn].xfer_asset(),
                ),
            ]
        )

    on_create = Seq(
        [
            Assert(Global.group_size() == Int(1)),
            App.globalPut(Bytes("total_value_exchanged"), Int(0)),
            App.globalPut(Bytes("god"), Txn.sender()),
            Int(1),
        ]
    )

    on_closeout = Int(1)

    on_opt_in = Int(1)

    on_create_sell = Seq(
        [
            Assert(
                And(
                    Global.group_size() == Int(4),
                    Txn.application_args.length() == Int(2),
                )
            ),
            App.localPut(Int(1), Bytes("user_address"), Txn.sender()),
            App.localPut(Int(1), Bytes("price"), Btoi(Txn.application_args[1])),
            App.localPut(Int(1), Bytes("assetID"), Gtxn[3].xfer_asset()),
            Assert(check_creator(asset_reserve, Int(3))),
            Int(1),
        ]
    )

    on_create_auction = Seq(
        [
            Assert(
                And(
                    Global.group_size() == Int(4),
                    Txn.application_args.length() == Int(3),
                )
            ),
            App.localPut(Int(1), Bytes("user_address"), Txn.sender()),
            App.localPut(Int(1), Bytes("price"), Btoi(Txn.application_args[1])),
            App.localPut(Int(1), Bytes("end_round"), Btoi(Txn.application_args[2])),
            App.localPut(Int(1), Bytes("assetID"), Gtxn[3].xfer_asset()),
            Assert(check_creator(asset_reserve, Int(3))),
            Int(1),
        ]
    )

    update_total_value = Seq(
        [
            App.globalPut(
                Bytes("total_value_exchanged"),
                Add(
                    App.globalGet(Bytes("total_value_exchanged")),
                    Gtxn[1].amount(),
                ),
            ),
        ]
    )

    on_buy = Seq(
        [
            Assert(
                And(
                    Global.group_size() == Int(3),
                    Txn.application_args.length() == Int(1),
                    App.localGet(Int(1), Bytes("sold")) != Int(1),
                )
            ),
            end_round,
            If(
                end_round.hasValue(),
                Seq(
                    [
                        Assert(
                            And(
                                Global.round()
                                > App.localGet(Int(1), Bytes("end_round")),
                                Gtxn[1].amount()
                                == App.localGet(Int(1), Bytes("price")),
                                Gtxn[1].sender()
                                == App.localGet(Int(1), Bytes("offering_address")),
                                App.localGet(Int(1), Bytes("assetID"))
                                == Gtxn[2].xfer_asset(),
                            )
                        ),
                        App.localPut(Int(1), Bytes("sold"), Int(1)),
                        update_total_value,
                        Int(1),
                    ]
                ),
                Seq(
                    [
                        Assert(
                            And(
                                Gtxn[1].amount()
                                == App.localGet(Int(1), Bytes("price")),
                                App.localGet(Int(1), Bytes("assetID"))
                                == Gtxn[2].xfer_asset(),
                            )
                        ),
                        App.localPut(Int(1), Bytes("sold"), Int(1)),
                        update_total_value,
                        Int(1),
                    ]
                ),
            ),
        ]
    )

    on_offer_auction = Seq(
        [
            Assert(
                And(
                    Global.group_size() == Int(1),
                    Txn.application_args.length() == Int(2),
                )
            ),
            Assert(
                And(
                    Global.round() <= App.localGet(Int(1), Bytes("end_round")),
                    Btoi(Txn.application_args[1])
                    > App.localGet(Int(1), Bytes("price")),
                )
            ),
            App.localPut(Int(1), Bytes("price"), Btoi(Txn.application_args[1])),
            App.localPut(Int(1), Bytes("offering_address"), Txn.sender()),
            Int(1),
        ]
    )

    on_redeem_close_escrow = Seq(
        [
            Assert(
                And(
                    Global.group_size() == Int(4),
                    Txn.application_args.length() == Int(1),
                )
            ),
            Assert(App.localGet(Int(1), Bytes("user_address")) == Txn.sender()),
            App.localDel(Int(1), Bytes("user_address")),
            App.localDel(Int(1), Bytes("end_round")),
            App.localDel(Int(1), Bytes("assetID")),
            Int(1),
        ]
    )

    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.CloseOut, on_closeout],
        [Txn.on_completion() == OnComplete.OptIn, on_opt_in],
        [
            Txn.on_completion() == OnComplete.NoOp,
            Cond(
                [Txn.application_args[0] == TXN_TYPE_CREATE_SELL, on_create_sell],
                [Txn.application_args[0] == TXN_TYPE_CREATE_AUCTION, on_create_auction],
                [Txn.application_args[0] == TXN_TYPE_BUY, on_buy],
                [Txn.application_args[0] == TXN_TYPE_OFFER_AUCTION, on_offer_auction],
                [
                    Txn.application_args[0] == TXN_TYPE_REDEEM_CLOSE_ESCROW,
                    on_redeem_close_escrow,
                ],
            ),
        ],
    )

    return program


if __name__ == "__main__":
    params = {}

    # Overwrite params if sys.argv[1] is passed
    if len(sys.argv) > 1:
        params = parseArgs(sys.argv[1], params)

    print(compileTeal(approval_program(params), Mode.Application, version=3))
    with open("./assets/cosmos_approval.teal", "w") as f:
        f.write(compileTeal(approval_program(params), Mode.Application, version=3))
